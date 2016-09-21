'use strict'

import React, {Component} from 'react'
import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableHighlight,
  Dimensions,
  Animated
} from 'react-native'

let {width,height} = Dimensions.get('window')

class TabBarItem extends Component {
  render() {
    let child = this.props.children
    if (child.length && child.length > 0) {
      throw new Error("onlyChild must be passed a children with exactly one child.")
    }

    return (
      <View style={styles.weight}>
        {child}
      </View>
    )
  }
}

export default class TabBar extends Component {
  static Item = TabBarItem

  static defaultProps = {
    defaultPage: 0,
    navFontSize: 12,
    navTextColor: '#999',
    navTextColorSelected: 'red',
  }

  static propTypes = {
    ...View.propTypes,
    style: View.propTypes.style,
    defaultPage: React.PropTypes.number,
    navFontSize: React.PropTypes.number,
    navTextColor: React.PropTypes.string,
    navTextColorSelected: React.PropTypes.string,
    onItemSelected: React.PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.visibles = []
    this.state = {
      layout:{
        width: width,
        height: height,
        x:0,
        y:0
      },
      selectedIndex: 0,
      toggleBarValue: new Animated.Value(0)
    }
  }

  // 获得徽章
  _getBadge(child) {
    let value = 0
      , badge = child.props.badge

    if (typeof badge == 'number') value = badge

    if (badge || value != 0) {
      const _badgeStyle = (typeof badge === 'number') ? styles.badgeWithNumber : styles.badgeNoNumber
      
      let valueStr = ''
      if (value > 99) valueStr = '99'
      else valueStr = badge

      return (
        <View style={[styles.badgeNumber, _badgeStyle, this.props.badgeStyle]}>
          <Text style={styles.badgeText}>{valueStr}</Text>
        </View>
      )
    }
  }

  // 放大按钮
  _stressPoint(child) {
    return child.props.point
  }

  // 隐藏底部
  _toggleBar(t, def) {
    if (def){
      return this.setState({
        toggleBarValue: new Animated.Value(-100)
      })
    }
    Animated.timing(
      this.state.toggleBarValue,{
        toValue: t? -100: 0,
        duration: 350,
      }
    ).start()
  }

  // 选择状态
  _update(index) {
    this.visibles[index] = true
    this.setState({
      selectedIndex: index,
    })

    if (this.props.onItemSelected) {
      this.props.onItemSelected(index)
    }
  }
  _resize(event) {
    const {x,y,width,height} = event.nativeEvent.layout;
    this.setState({layout:{x,y,width,height}});

    console.log('=================', this.state.layout)
  }
  _gone(){
    return {
      top: this.state.layout.height,
      bottom: -this.state.layout.height,
    }
  }

  componentDidMount() {
    let page = this.props.defaultPage

    if (page >= this.props.children.length || page < 0){
      page = 0
    }

    this._update(page)

    // 默认隐藏底部bar
    if (this.props.toggle) this._toggleBar(true, 'default')
  }

  componentWillReceiveProps(nextProps) {
    // 隐藏底部bar
    this._toggleBar(nextProps.toggle)
  }

  render() {
    let children = this.props.children
    if (!children.length) {
      throw new Error("at least two child component are needed.")
    }

    // 底部tab按钮组
    let navs = []

    const contentViews = children.map((child, i) => {
        const isSelectIndex = this.state.selectedIndex == i
          , childProps = child.props
          , imgSrc =isSelectIndex ? childProps.selectedIcon : childProps.icon
          , color = isSelectIndex ? this.props.navTextColorSelected : this.props.navTextColor

        navs[i] = (
          <TouchableHighlight
            key={i}
            activeOpacity={1}
            underlayColor={'transparent'}
            style={[styles.navItem,
              this._stressPoint(child)? styles.navItemChange:null,
              child.props.style,
            ]}
            onPress={() => {
              if (childProps.onPress) {
                child.props.onPress()
              }

              this._update(i)
            }}>
            <View style={styles.center}>
              <View style={this._stressPoint(child) ? styles.iconBadgeBoxChange : styles.iconBadgeBox}
              >
                {
                  this._stressPoint(child) ?
                  <View style={styles.iconImageChangeBox}>
                    <View style={styles.iconImageChangeBoxBefore} />
                    <View style={styles.iconImageChangeBoxAfter} />
                    <Image
                      source={imgSrc}
                      resizeMode='cover'
                      style={styles.iconImageChange}
                    />
                  </View>
                  : 
                  <Image
                    source={imgSrc}
                    resizeMode='cover'
                    style={styles.iconImage}
                  />
                }

                {this._getBadge(child)}
              </View>
              <View style={styles.navTextBox}>
                <Text
                  style={[styles.navText,
                    {color: color,fontSize: this.props.navFontSize},
                    this._stressPoint(child) ? styles.navTextChange: undefined]}
                >
                  {childProps.title}
                </Text>
              </View>
            </View>
          </TouchableHighlight>
        )

        if (!this.visibles[i]) {
          return null
        } else {
          // 显示隐藏内容区域
          const style = this.state.selectedIndex === i ? styles.base : [styles.base,this._gone()]
          return (
            <View
              key={'view_' + i}
              style={style}>
              {child}
            </View>
          )
        }
      }
    )

    return (
      <View style={[styles.container, this.props.style]}>
        <View style={styles.content}>
          {contentViews}
        </View>
        <Animated.View style={[styles.navBox, {marginBottom: this.state.toggleBarValue}]}>
          <View style={styles.navBg} />
          <View style={styles.nav}>
            {navs}
          </View>
        </Animated.View>
      </View>
    )
  }

}



const styles = StyleSheet.create({
  weight: {
    flex: 1,
  },
  container: {
    flex: 1,
    overflow: 'hidden'
  },
  content: {
    flex: 1,
    overflow: 'hidden'
  },
  base: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  gone: {
      top: height,
      bottom: -height,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  navBox: {
    marginTop:-16,
  },
  nav: {
    flexDirection: 'row',
  },
  navBg: {
    position: 'absolute',
    top: 16,
    left: 0,
    right:0,
    bottom:0,
    borderColor: '#aaa',
    borderTopWidth: 1,
    backgroundColor: '#f3f3f3',
  },
  navItem: {
    flex: 1,    
    alignItems: 'center',
    marginTop: 16, 
  },
  navItemChange: {
    marginTop: 0, 
  },

  iconBadgeBox:{
    width: 48,
    height: 32,
    paddingTop: 8,
    paddingLeft: 12,
    paddingRight: 12,
    
  },
  iconBadgeBoxChange:{
    width: 80,
    height: 48,
    paddingTop:0,
  },
  iconImage: {
    width: 24,
    height: 24,
  },
  iconImageChange: {
    width: 40,
    height: 40,
    marginLeft:12,
    marginRight:12,
  },
  iconImageChangeBox: {
    width: 80,
    height: 48,
    paddingLeft:8,
    paddingTop:8,
    paddingRight:8,
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    alignSelf: 'center',
    backgroundColor:'#fff'
  },
  iconImageChangeBoxAfter:{
    position:'absolute',
    top: 17,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor:'#f3f3f3'
  },
  iconImageChangeBoxBefore:{
    position:'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    borderWidth:1,
    borderColor: '#aaa',
    backgroundColor:'#f3f3f3'
  },
  
  badgeNumber:{
    position:'absolute',
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: '#ff0000',
  },
  badgeNoNumber: {
    top: 4,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeWithNumber: {
    top: 2,
    right:0,
    width: 16,
    height: 16,
    borderRadius: 8,    
  },
  badgeText: {
    alignSelf: 'center',
    fontSize: 10,
    color: '#fff',
  },
  navTextBox:{
    height: 20,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',

  },
  navTextChange: {
    fontSize: 12,
  },
  navText: {
    fontSize: 12,
    color:'#999'
  },
  
})