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
        if (this.props.rotate && d3.max(this.props.axis.scale().domain().map(d => d.length)) > 1) {
            d3.select(node).call(this.props.axis)
                .selectAll("text")
                .attr("y", 0)
                .attr("x", 9)
                .attr("dy", ".35em")
                .attr("transform", "rotate(60)")
                .style("text-anchor", "start");
        } else {
            d3.select(node).call(this.props.axis)
        }

        /*
        .selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");*/
    }

    render() {
        const translatex = `translate(0,${this.props.h})`;
        const translatey = 'translate(-10, 0)';
        const textTranslateX = `translate(${this.props.w / 2},${30})`;
        const textTranslateY = `translate(-30, ${this.props.h / 2})rotate(270)`;
        return (
            <g className="axis" ref={this.axis} transform={this.props.axisType === 'x' ? translatex : translatey}>
                <text
                    fill="black"
                    textAnchor={"middle"}
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
    rotate: PropTypes.bool,
    axis: PropTypes.func.isRequired,
    axisType: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
};
export default Axis;
