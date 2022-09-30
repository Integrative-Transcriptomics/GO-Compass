import React from 'react';
import Slide from '@material-ui/core/Slide';


export default function NestedDrawer(props) {
  return (
    <Slide direction={props.direction} in={props.open}  style={{position:"relative"}}>
          {props.children}
    </Slide>
  );
}