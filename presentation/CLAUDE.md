# Maintaining the Muttaka rehearsal

Open index.html directly from disk. Keep all runtime assets in this folder and use classic scripts. The screen is a scaled 1920 × 1080 stage. The Start scene is page 0. Replace the temporary Test page when the first project scene is added.

## Add a click

Use js/deck.js to assemble the paused GSAP timeline. Set starting values with gsap.set before adding timeline operations. Call B.scene(title), then add reversible animations with B.timeline.to or B.timeline.set. B.t() returns the current end time. Call B.beat(name, notes) after the animation to establish the stop. Include English and Arabic notes separated by a blank line. At the end of a scene, animate its elements out on the way to the next beat.

Load scene scripts after js/engine.js and before js/deck.js. Register a named builder in Deck.slots and call B.slot(name) where it belongs in the sequence. Deck.extras.push(builder) appends a builder after the main sequence. Deck.watch(object, draw) redraws when the object's initial numeric properties change. Keep the drawing a function of current values so reverse and instant jumps work. Deck.split returns character spans. Deck.typer and Deck.decode return a state with progress from 0 to 1. Deck.counter returns a state with an animatable value.

Keep the opening quiet. Record the evidence for each new platform claim in docs/sources.md. Regenerate the thumbnails after changing beats and check the operator controls from file URLs. Write newly rendered thumbnails only inside assets/thumbs. Test keyboard navigation in both directions and check that the presenter mirrors blackout and upcoming beats. Follow the repository deployment instructions.
