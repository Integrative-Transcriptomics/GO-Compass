import PropTypes from 'prop-types';
import React from 'react';
import * as d3 from 'd3';

/**
 * Axis component
 */
class Axis extends React.Component {
    constructor(props) {
        super(props);
        this.axis = React.createRef()
    }

    componentDidMount() {
        this.renderAxis();
    }

    componentDidUpdate() {
        this.renderAxis();
    }

    renderAxis() {
        // eslint-disable-next-line react/no-find-dom-node
        const node = this.axis.current;
        d3.select(node).call(this.props.axis);
    }

    /**
     * computes the width of a text
     * @param {string} text
     * @param {number} fontSize
     * @returns {number}
     */
    static getTextWidth(text, fontSize) {
        const context = document.createElement('canvas').getContext('2d');
        context.font = `${fontSize}px Arial`;
        return context.measureText(text).width;
    }


    render() {
        const translatex = `translate(0,${this.props.h})`;
        const translatey = 'translate(-10, 0)';
        const textWidth = Axis.getTextWidth(this.props.label, 12);
        const textTranslateX = `translate(${(this.props.w - textWidth) / 2},${30})`;
        const textTranslateY = `translate(-30, ${(this.props.h - textWidth) / 2})rotate(270)`;
        return (
            <g className="axis" ref={this.axis} transform={this.props.axisType === 'x' ? translatex : translatey}>
                <text
                    fill="black"
                    transform={this.props.axisType === 'x' ? textTranslateX : textTranslateY}
                >
                    {this.props.label}
                </text>
            </g>
        );
    }
}

Axis.propTypes = {
    h: PropTypes.number.isRequired,
    w: PropTypes.number.isRequired,
    axis: PropTypes.func.isRequired,
    axisType: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
};
export default Axis;
