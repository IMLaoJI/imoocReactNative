import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import _ from 'lodash';

const FacebookTabBar = React.createClass({
  tabIcons: [],

  propTypes: {
    goToPage: React.PropTypes.func,
    activeTab: React.PropTypes.number,
    tabs: React.PropTypes.array,
  },

  componentDidMount() {
    this._listener = this.props.scrollValue.addListener(this.setAnimationValue);
  },

  setAnimationValue({ value, }) {
    this.tabIcons.forEach((icon, i) => {
      const progress = (value - i >= 0 && value - i <= 1) ? value - i : 1;
      /*icon.setNativeProps({
        style: {
          color: this.iconColor(progress),
        },
      });*/
    });
  },

  //color between rgb(59,89,152) and rgb(204,204,204)
  iconColor(progress) {
    const red = 59 + (204 - 59) * progress;
    const green = 89 + (204 - 89) * progress;
    const blue = 152 + (204 - 152) * progress;
    return `rgb(${red}, ${green}, ${blue})`;
  },

  render() {
    return <View style={[styles.tabs,  ]}>
      {this.props.tabs.map((tab, i) => {
        return <TouchableOpacity key={tab.icon} onPress={() => this.props.goToPage(i)} style={styles.tab}>
            <Icon
              name={tab.icon}
              size={30}
              color={this.props.activeTab === i ? (tab.colorSelect||'rgb(59,89,152)') : tab.color||'rgb(204,204,204)'}
              ref={(icon) => {this.tabIcons[i] = icon}}
            />
          <Text style={{color:this.props.activeTab === i ? (tab.colorSelect||'rgb(59,89,152)') : tab.color||'rgb(204,204,204)'}}>{tab.title}</Text>
        </TouchableOpacity>;
      })}
    </View>;
  },
});

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
  },
  tabs: {
    flexDirection: 'row',
    paddingTop: 5,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomColor: 'red',
  },
});

export default FacebookTabBar;