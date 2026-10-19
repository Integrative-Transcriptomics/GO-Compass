import React, { useEffect, useRef } from "react";
import { observer } from "mobx-react";

// required for bookmarking and annotating notes in the provenance graph, otherwise it'll show little ugly boxes
import "semantic-ui-css/semantic.min.css";

// trrack-vis visualization
import { ProvVisCreator } from "@visdesignlab/trrack-vis";

/* MobX-observed props, draw provenance graph into div element, trigger React useEffect when side drawer opens (props.open) or provenance changes (props.rootStore.provenance)
 * Side branches of the graph will have their node labels hidden, even if there is enough screen space to display them. This is, unfortunately, a hardcoded "feature".
 * Tried my best to document it. Full Documentation available here: https://vdl.sci.utah.edu/trrack/trrack-vis-docs/globals.html#provvis
 */
const ProvenanceGraph = observer((props) => {

    // initialize empty references for ProvVisCreator
    const containerReference = useRef(null);

    useEffect(() => {
        // check if provenance information is actually present AND if the drawer on the right is open AND if there's an actual DOM element we can draw into (onto?)
        if (props.rootStore.provenance && props.open && containerReference.current) {

            // empty out old provenance graph before drawing the next one [containerReference.current.innerHTML = "" might work]
            // https://www.xjavascript.com/blog/remove-all-child-elements-of-a-dom-node-in-javascript/#method-4-using-replacechildren
            containerReference.current.replaceChildren();

            const { width, height } = containerReference.current.getBoundingClientRect();

            ProvVisCreator(
                // DOM element to draw graph into
                containerReference.current,

                // The Provenance data that we want to render, taken directly from RootStore
                props.rootStore.provenance,

                // Clicking a node in the graph calls the provenance's goToNode(id), which sets that provenance's current state to the state of that node.
                (id) => props.rootStore.provenance.goToNode(id),

                // buttons: Should allow us to select if the provenance graph is displayed with its own "buttons". This may refer to the undo/redo buttons... or not.
                // The documentation simply calls this "buttons". Setting it to false doesn't seem to do anything
                true,

                // ephemeralUndo, educated guess: Setting this to true likely allows the user to undo ephemeral provenance actions. Cannot test, as I'm not using any ephemeral actions
                // All tracked actions GO-Compass performs are by definition meaningful, as I'm only tracking the action I consider meaningful. No random mouse movements or such.
                false,

                // fauxRoot: GO-Compass currently does not use faux roots ("pseudo roots"). We always render the graph starting at the real root.
                // The Trrack developers initialize this as the graph's root, i.e. props.rootStore.provenance.graph.root. A real root is also a fauxRoot.
                props.rootStore.provenance.graph.root,

                // Additional config settings
                {
                    width, height,
                    popupContent: (node) => node.label, // Hovering your mouse over a graph node displays its label
                    editAnnotations: true,              // Either this does not actually make annotations editable, or I'm overlooking something...
                    verticalSpace: 30                   // Changes visual space above and below each graph node. default is 50, 30 looks better
                }
            );
        }
    }, [props.open, props.rootStore.provenance]);

    // Consideration: Overwrite horizontal scroll bar at the bottom of the drawer so last node is selectable even if graph is long.
    return <div ref={containerReference} style={ { width: "100%", height: "100%" } } />;
});

export default ProvenanceGraph // App.js imports it
