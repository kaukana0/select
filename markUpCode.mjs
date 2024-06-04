/*
all HTML and CSS as JS string
*/

export default class MarkUpCode {


	static mainElements(ms) {
		return `
		<div id='${ms.domElementIds.headBox}' tabindex="0">
		  <div id='${ms.domElementIds.headBoxContent}' style="display:flex; align-items:center;">&varnothing;</div>
			<div id='${ms.domElementIds.listContainer}'>
				<ul id='${ms.domElementIds.list}'></ul>
				<center id='${ms.domElementIds.btnC}'>
					<button id='${ms.domElementIds.btn}' type="button">Reset</button>
				</center>
			</div>
		</div>
		`
	}

	static css(ms, zIndex) {
		const theBoxItself = `<style>


		.rotate-180 {
			transform: rotate(180deg);
			transition: transform .3s ease-in-out;
		}

		#${ms.domElementIds.headBox} {
			position:relative;
			display: flex;
			cursor: pointer;
			height: 40px;
			align-items: center;
			//padding: 0.2em;
			/*font-weight: bold;*/
			font-size: 1rem;

			//margin-left: 1px;
			//margin-right: 1px;
			border: 1px solid #515560;
			background-color: #fff;
			border-radius: 4px;
		  box-shadow: inset 0 2px 4px rgba(9,49,142,.08),inset 0 0 10px rgba(9,49,142,.04),inset 0 4px 5px rgba(9,49,142,.04),inset 0 -4px 4px rgba(9,49,142,.04);

		}

		#${ms.domElementIds.headBox}:hover {
			/*border-color: #515560;*/
		}

		
		#${ms.domElementIds.headBoxContent} {
			height: 1.8em;
			width: 100%;
			overflow: hidden;
			//margin-left: 0.3em;
			padding-left: 14px;
			text-align: left;
			color: #141517;
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
			height: 42px;
			background: #0E47CB;
			right: 0px;
			border: 0px;
			border-top-right-radius: 3px;
			border-bottom-right-radius: 3px;
			pointer-events: none;
			transition: transform .3s ease-in-out;
		}

		#${ms.domElementIds.headBox}.pointUp::after {
			content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-35 -38 42 42' width='100%' height='35px' stroke='white' fill='white' %3E%3Cpath d='M18.2 17.147c.2.2.4.3.7.3.3 0 .5-.1.7-.3.4-.4.4-1 0-1.4l-7.1-7.1c-.4-.4-1-.4-1.4 0l-7 7c-.3.4-.3 1 .1 1.4.4.4 1 .4 1.4 0l6.2-6.2 6.4 6.3z' stroke-linecap='butt' stroke-width='0.1' stroke-linejoin='round' transition='transform .1 ease-in-out' transform-box='fill-box' transform-origin='1500 -1500.5' transform='rotate(1)'     /%3E%3C/svg%3E")
		}

		#${ms.domElementIds.headBox}:hover:after {
			background-color: #3e6cd5;
		}

		#${ms.domElementIds.listContainer} {
			display: none;
			background-color: #fff;
			overflow: hidden;
			border: none;
			z-index: ${zIndex};
			max-height: 400px;
			top: 43px;
			margin-left: 0px;
			margin-right: 0px;
			//padding-left: 0.3em;
			left: -1px;
			width: calc(100% + 2px);
			position: absolute;
			text-align: left;
			font-weight: normal;
			font-size: 1rem;

			border-radius: 4px;
			box-shadow: 0 2px 4px rgba(9,49,142,.08),0 0 10px rgba(9,49,142,.04),0 4px 5px rgba(9,49,142,.04),0 -4px 4px rgba(9,49,142,.04);
			box-sizing: border-box;
			cursor: default;
		}
		
		#${ms.domElementIds.list} {
			list-style: none;
			padding-inline-start: 0;
			max-height: 300px;
			overflow: auto;
			margin:0;
		}
		
		#${ms.domElementIds.list} li {
			padding-top: 0.3em;
			padding-left: 0.3em;
			padding-right: 0.3em;
			line-height: 1.8rem;
			padding: 5px 16px 5px 16px;
		}
		
		#${ms.domElementIds.list} li:hover {
			background-color: #f3f6fc;
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
			border-radius: 12px;
			color: #fff;
			display: inline-flex;
			font: normal normal 400 0.8rem/0.2rem Arial,sans-serif;
			height: auto;
			justify-content: center;
			padding: 0.75rem;
			position: relative;
			height: 0px;
			width: 0px;
			margin-right: 5px;
			margin-top: -2px;
		}

		ul {}

		.groupHeader {
			display: inline-flex;
			font-weight: 700 !important;
		}

		.item {
			color: #171A22;
			display: inline-flex;
			flex-flow: row;

			font: normal normal 400 1.0rem Arial,sans-serif;
			white-space: pre-wrap;
			vertical-align: baseline;
			align-items: center;
			margin-top: 2px;
			margin-bottom: 2px;

			line-height: 2rem;
		}

		// doesn't work for checkbox border
		.item:hover {
			border-color: #3e6cd5;
		}

		.indented {
			margin-left: 1.5rem;
		}

		.disabled {
			color: grey;
		}

		#${ms.domElementIds.btnC} {
			display: none;
			width: 100%;
			padding: 10px 0 10px 0;
			border-top: solid 1px;
			border-color: #cfdaf5;
		}

		#${ms.domElementIds.btn} {
			overflow: visible;
			text-transform: none;
			appearance: none;
			background: none;
			border-radius: 4px;
			cursor: pointer;
			margin: 0;
			min-width: 44px;
			text-decoration: none;
			background-color: #0e47cb;
			border: 2px solid #0e47cb;
			color: #fff;
			width: 80%;
			min-height: 2.5rem;
			margin: 3px 0 3px 0;
			font-size: 1rem;
			}
			
			#${ms.domElementIds.btn}:hover {
				background-color: #3e6cd5;
				border-color: #3e6cd5;
				color: #fff;
				box-shadow: 0 2px 4px rgba(9, 49, 142, 0.08),
				0 0 10px rgba(9, 49, 142, 0.04), 0 4px 5px rgba(9, 49, 142, 0.04),
				0 -4px 4px rgba(9, 49, 142, 0.04);
				text-decoration: none;
			}

			hr {
				width:90%; 
				//color:#cfdaf5;
				color: darkgrey;
				border-top:0;
			}

		</style>`

		const checkbox = `
		<style>
		input[type="checkbox"] {
			-webkit-appearance:none;
			height:1.8em;
			width:1.8em;
			cursor:pointer;
			position:relative;
			border: 2px solid #515560;
			border-radius: 2px;
			border-shadow: 0 2px 4px rgba(9,49,142,.08), 0 0 10px rgba(9,49,142,.04), 0 4px 5px rgba(9,49,142,.04), 0 -4px 4px rgba(9,49,142,.04)
		}
		
		input[type="checkbox"]:checked {
			background-color:#0e47cb;
			border-color: #0e47cb;
		}
		
		input[type="checkbox"]:before, input[type="checkbox"]:checked:before {
			position:absolute;
			top:0;
			left:0;
			width:100%;
			height:100%;
			line-height:1.5em;
			text-align:center;
			color:white;
		}
		input[type="checkbox"]:checked:before {
			content:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xml:space='preserve' viewBox='0 0 24 24' focusable='false' aria-hidden='true' %3E %3Cpath fill='white' d='m19.2 6.4-9.9 9.9-3.5-3.6c-.4-.4-1-.4-1.4 0-.4.4-.4 1 0 1.4l4.2 4.2c.4.4 1 .4 1.4 0L20.6 7.8c.4-.4.4-1 0-1.4-.2-.2-.5-.3-.7-.3-.3 0-.5.1-.7.3z'%3E%3C/path%3E%3C/svg%3E");
		}
		</style>`


		
		return theBoxItself + checkbox
	}

	// just for 1 row. a means to have a right column which is left aligned.
	static grid(fractions, content) {
		return `
			<div style="display: grid; grid-template-columns: ${fractions}fr 1fr;  align-items: center;">
				${content}
			</div>
		`
	}

	static singleSelectItem(ms, key, val, enabled=true, fractions=3) {
		return `
			<li id="${ms.domElementIds.listItemPrefix}${key}" key="${key}" val="${val}" tabindex="0" isSelectable role="option">
				${MarkUpCode.grid(fractions, `<div>${val}</div>`)}
			</li>
		`
	}

	static multiSelectItem(ms, key, val, hasFavStar=false, fractions=1, indented=false, enabled=true, displayKeys=false) {
		const favStarHtml =  hasFavStar ? MarkUpCode.button() : ""
		const keyHtml = displayKeys ? key : ""
		return `
			<li id="${ms.domElementIds.listItemPrefix}${key}" key="${key}" val="${val}" isSelectable isCheckable isCollectable role="option">
				${MarkUpCode.grid(fractions, `
					<div class="item ${indented?"indented":""}  ${enabled?"":"disabled"}   ">
						${this.checkbox(enabled)}
						<p style="margin:2px 0 2px 6px;">${val}</p>
					</div>
						${favStarHtml}
						${keyHtml}
						`)}
			</li>
		`
	}

	static button() {
		// the pointer-events thing makes it ignore events - only from the js
		// should it be set programatically, otherwise the ecl-like-select-x JS doesn't
		// know that it's checked and everything goes out of sync
		return `<div style="height:40px; width:40px; pointer-events: none;" favstar>
			<symbol-button style="width:100%; height:100%;" symbol="starFilled" symbolDeactivated="star"></symbol-button>
		</div>`
	}

	static groupHeader(ms=null, text="", isSelectable=false, hasSeparator=true, enabled=false) {
		if(text==="") {
			if(hasSeparator) { return this.separator() }
		} else {
			const sel = isSelectable ? this.checkbox(enabled) : ""
			const is = isSelectable? "isSelectable isCheckable" : ""
			const styleSel = isSelectable ? "" : "pointer-events:none;"
			const styleDisabled = enabled ? "" : "color:grey;"

			return (hasSeparator ? this.separator() : "") + `
				<li id='${ms.domElementIds.listItemPrefix}${text}' key='${text}' val='${text}' ${is} style='${styleSel} ${styleDisabled}' isGroupStart='true'>
					${MarkUpCode.grid(3, `<div class="item groupHeader ${enabled?"":"disabled"}">${sel} <p style="margin:2px 10px;">${text}</p></div>`)}
				</li>
			`
		}
		return ""
	}

	// note: transform makes a y-scrollbar appear. it goes away w/ specifying some height.
	static checkbox(enabled=true, checked=false) {
		const cl = enabled?"":"border-color:lightgrey;"
		return `<input ${cl} type='checkbox' ${checked?"checked=true":""} style="pointer-events: none; accent-color: #0e47cb; ${cl}"  aria-selected="${checked?"true":"false"}"></input>`
	}

	static headBoxContent(text, numba, rightAlignedText) {
		let retVal = "<span style='display:flex; align-items:center; flex-grow:1; margin-top:2px;'>"
		if(numba===null) {
			retVal += text
		} else {
			retVal += this.circledNumber(numba) + text
		}
		retVal+="</span>"
		if(rightAlignedText != "") {
			retVal += "<span style='align-items:center; padding-right:50px;'>"+rightAlignedText+"</span>"
		}
		return retVal
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
