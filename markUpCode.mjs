/*
all HTML and CSS as JS string
*/

export default class MarkUpCode {


	static mainElements(ms) {
		return `
		<div id='${ms.domElementIds.headBox}' tabindex="0">
		  <div id='${ms.domElementIds.headBoxContent}'>&varnothing;</div>
		  <ul id='${ms.domElementIds.list}'></ul>
		</div>
		`
	}

	static css(ms, zIndex) {
		return `<style>
		#${ms.domElementIds.headBox} {
			position:relative;
			display: flex;
			cursor: pointer;
			height: 2em;
			align-items: center;
			padding: 0.2em;
			/*font-weight: bold;*/
			font-size: 1.1rem;

			margin-left: 1px;
			margin-right: 1px;
			border: 1px solid #515560;
			background-color: #fff;
			border-radius: 3px;
		  box-shadow: inset 0 2px 4px rgba(9,49,142,.08),inset 0 0 10px rgba(9,49,142,.04),inset 0 4px 5px rgba(9,49,142,.04),inset 0 -4px 4px rgba(9,49,142,.04);

		}
		
		#${ms.domElementIds.headBoxContent} {
			height: 1.8em;
			width: 100%;
			overflow: hidden;
			margin-top: 0.4em;
			margin-left: 0.3em;
			text-align: left;
		}
		
		/* this is bootstrap's CSS triangle; only positionable here via margin */
		#${ms.domElementIds.headBox}:after {
			/* simpler, relatively similar to fontawesome
			content:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-5 -5 37 37' width='100%' height='48px' stroke='white' fill='none' %3E%3Cpath d='M7 10L13 16L19 10' stroke-width='3.5' stroke-linecap='butt' stroke-linejoin='round'/%3E%3C/svg%3E");
			*/
		
			/* same path as fontawesome
			content:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-200 -100 700 700' width='100%' height='48px' stroke='white' fill='white' %3E%3Cpath d='M143 352.3L7 216.3c-9.4-9.4-9.4-24.6 0-33.9l22.6-22.6c9.4-9.4 24.6-9.4 33.9 0l96.4 96.4 96.4-96.4c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9l-136 136c-9.2 9.4-24.4 9.4-33.8 0z' stroke-linecap='butt' stroke-linejoin='round'/%3E%3C/svg%3E");
			*/

			/* same path as ECL*/
			content:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-35 -38 42 42' width='100%' height='35px' stroke='white' fill='white' %3E%3Cpath d='M18.2 17.147c.2.2.4.3.7.3.3 0 .5-.1.7-.3.4-.4.4-1 0-1.4l-7.1-7.1c-.4-.4-1-.4-1.4 0l-7 7c-.3.4-.3 1 .1 1.4.4.4 1 .4 1.4 0l6.2-6.2 6.4 6.3z' stroke-linecap='butt' stroke-width='0.1' stroke-linejoin='round' transform='rotate(180)' /%3E%3C/svg%3E");

			text-align: center;
			position: absolute;
			width: 44px;
			height: 43px;
			background: #0E47CB;
			right: 0px;
			border: 0px;
			border-top-right-radius: 3px;
			border-bottom-right-radius: 3px;
			pointer-events: none;
		}
		
		#${ms.domElementIds.list} {
			display: none;
			list-style: none;
			background-color: #fff;
			overflow: auto;
			border: 1px solid rgba(0,0,0,1);
			z-index: ${zIndex};
			max-height: 400px;
			top: 1.8em;
			margin-left: 0px;
			margin-right: 0px;
			padding-left: 0.3em;
			left: -1px;
			width: 98.5%;
			position: absolute;
			text-align: left;
			font-weight: normal;
			font-size: 1rem;
		}
		
		#${ms.domElementIds.list} li {
			padding-top: 0.3em;
			padding-left: 0.3em;
			padding-right: 0.3em;
			line-height: 1.8rem;
		}
		
		#${ms.domElementIds.list} li:hover {
			background-color: #CCC;
			color: black;
		}
		
		[dropdown-item-checked] {
			background-color: #044aa308;
		}

		/* after the first child
		[dropdown-item-checked] ::after {
			position: absolute;
			right: 0.8rem;
			margin-top: 1px;
			content: '';
			width: 6px;
			height: 12px;
			border-bottom: 3px solid #666;
			border-right: 3px solid #666;
			transform: rotate(45deg);
			-o-transform: rotate(45deg);
			-ms-transform: rotate(45deg);
			-webkit-transform: rotate(45deg);
			border-color: black;
		}*/

		.count {
			align-items: center;
			background-color: #0e47cb;
			border-radius: 50%;
			color: #fff;
			display: inline-flex;
			font: normal normal 400 0.8rem/0.2rem Arial,sans-serif;
			vertical-align: bottom;
			height: auto;
			justify-content: center;
			padding: 0.75rem;
			position: relative;
			height: 0px;
			width: 0px;
			margin-right: 5px;
		}

		.groupHeader {
			color: #707070;
			font: normal normal 400 1rem/1.5rem Arial,sans-serif;
			font-weight: 700;
			margin: 0.5rem 0;
		}

		.item {
			color: #000;
			display: inline-flex;
			flex-flow:row;

			font: normal normal 400 16px Arial,sans-serif;
			white-space: pre-wrap;
			vertical-align: baseline;

			font-size:1.0rem;
			line-height: 2.5rem;

		}
		</style>`
	}

	// just for 1 row. a means to have a right column which is left aligned.
	static grid(fractions, content) {
		return `
			<div style="display: grid; grid-template-columns: ${fractions}fr 1fr;">
				${content}
			</div>
		`
	}

	static singleSelectItem(ms, key, val) {
		return `
			<li id="${ms.domElementIds.listItemPrefix}${key}" key="${key}" val="${val}" tabindex="0" isSelectable>
				${MarkUpCode.grid(1, `<div>${val}</div>`)}
			</li>
		`
	}

	static multiSelectItem(ms, key, val, hasFavStar=false, fractions=1) {
		const favStarHtml =  hasFavStar ? 
		MarkUpCode.button("star", "favstar")
		 : ""
		// the pointer-events thing makes it ignore events - only from the js
		// should it be set programatically, otherwise the ecl-like-select-x JS doesn't
		// know that it's checked and everything goes out of sync
		return `
			<li id="${ms.domElementIds.listItemPrefix}${key}" key="${key}" val="${val}" tabindex="0" isSelectable isCheckable isCollectable>
				${MarkUpCode.grid(fractions, `
					<div class="item">
						<input type='checkbox' style="transform: scale(1.7); pointer-events: none; accent-color: #0e47cb;">
						<p style="margin:2px 10px;">${val}</p>
					</div>
						${favStarHtml}`)}
			</li>
		`
	}

	static button(symbol, attribs) {
		return `<div tabindex="0" favstar><symbol-button id="${symbol}" symbol="${symbol}" ${attribs}></symbol-button></div>`
	}

	static groupHeader(ms=null, text="", isSelectable=false, hasSeparator=true) {
		if(text==="") {
			if(hasSeparator) { return this.separator() }
		} else {
			const sel = isSelectable ? "<img src='components/select/img/selectall.png' style='height:1rem;'>" : ""
			const is = isSelectable? "isSelectable" : ""
			const style = isSelectable ? "" : "pointer-events:none;"
			return (hasSeparator ? this.separator() : "") + `
				<li id='${ms.domElementIds.listItemPrefix}${text}' key='${text}' val='${text}' tabindex="0" ${is} style="${style}">
					${MarkUpCode.grid(99, `<div class="groupHeader">${sel} ${text}</div>`)}
				</li>
			`
		}
		return ""
	}

	static headBoxContent(text, numba) {
		if(numba===null) {
			return "<span>" + text + "</span>"
		} else {
			return "<span>"+this.circledNumber(numba) + text + "</span>"
		}
	}

	static image(path, key) {
		return path ? `<img src='${path}/${key}.png' style="height:1.4rem; vertical-align: text-bottom;"></img>` : ""	
	}

	static separator() { return "<hr>" }

	static circledNumber(number) {
		return `<span class="count">${number}</span>`
	}

	// helper
	static getHtmlTemplate(source) {
		const t = document.createElement('template')
		t.innerHTML = source
		return t.content
	}
}
