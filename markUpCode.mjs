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
			border: 1px solid rgba(0,0,0,1);
			cursor: pointer;
			height: 2em;
			align-items: center;
			padding: 0.2em;
			/*font-weight: bold;*/
			font-size: 1.1rem;
		}
		
		
		#${ms.domElementIds.headBoxContent} {
			height: 1.8em;
			width: 100%;
			overflow: hidden;
			margin-top: 0.4em;
			margin-left: 0.3em;
			text-align: left;
		}
		
		#${ms.domElementIds.headBoxContent} button {
			color:black; 
			vertical-align: text-bottom;
			/*background-color: #FFFFED;*/
			border: 1px solid black;
			border-radius:2px;
			/*border-radius:14px;*/
		}
		
		/* this is bootstrap's CSS triangle; only positionable here via margin */
		#${ms.domElementIds.headBox}:after {
			content: "";
			border-top: 0.3em solid;
			border-right: 0.3em solid transparent;
			border-bottom: 0;
			border-left: 0.3em solid transparent;
			margin-right: 0.255em;
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
			font: normal normal 400 1.2rem/0.6rem arial,sans-serif;
			height: auto;
			justify-content: center;
			padding: 0.75rem;
			position: relative;
			top: -3px;
			text-align: center;
			/*width: 32px;*/
		}

		.groupHeader {
			color: #707070;
			font: normal normal 400 1rem/1.5rem arial,sans-serif;
			font-weight: 700;
			margin: 0.5rem 0;
		}

		.item {
			color: #404040;
			display: inline-flex;
			font: normal normal 400 1rem/1.5rem arial,sans-serif;
			white-space: pre-wrap;
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
			<li id='${ms.domElementIds.listItemPrefix}${key}' key='${key}' val='${val}' tabindex="0" isSelectable>
				${MarkUpCode.grid(1, `<div>${val}</div>${favHtml}`)}
			</li>
		`
	}

	static multiSelectItem(ms, key, val, hasFavStar=false, fractions=1) {
		const favStarHtml =  hasFavStar ? `<div tabindex="0" favStar>-</div>` : ""
		return `
			<li id='${ms.domElementIds.listItemPrefix}${key}' key='${key}' val='${val}' tabindex="0" isSelectable isCheckable isCollectable>
				${MarkUpCode.grid(fractions, `<div class="item container"><input type='checkbox' class="my-checkbox">${val}</div>${favStarHtml}`)}
			</li>
		`
	}

	static groupHeader(ms=null, text="", isSelectable=false) {
		if(text==="") {
			return this.separator()
		} else {
			const selHtml = isSelectable ? "<img src='img/selectall.png' style='height:1rem;'>" : ""
			const is = isSelectable? "isSelectable" : ""
			return this.separator() + `
				<li id='${ms.domElementIds.listItemPrefix}${text}' key='${text}' val='${text}' tabindex="0" ${is}>
					${MarkUpCode.grid(1, `<div class="groupHeader">${selHtml} ${text}</div>`)}
				</li>
			`
		}
	}

/*
	// use OG or LI attribute "groupStart"
	static listItem(ms, key, val, path, hasFavStar, fractions, selectable=true, hasCheckbox=true) {
		const imgHtml =  MarkUpCode.image(path, key)
		const favHtml =  hasFavStar ? `<div tabindex="0" favStar>-</div>` : ""
		let ting = selectable && hasCheckbox ? "<input type='checkbox'>" : ""
		    ting = selectable && !hasCheckbox ? "[X]" : ting
		const disable = selectable ? "" : "style='pointer-events:none; cursor:pointer;'"
		const tsc = selectable ? "trigger-sel-callback" : ""
		return `
			<li id='${ms.domElementIds.listItemPrefix}${key}' key='${key}' val='${val}' tabindex="0" ${disable} ${tsc}>
				${MarkUpCode.grid(fractions, `<div>${ting}${val}</div>${favHtml}`)}
			</li>
		`
	}

	static groupHeader(ms, text, selectable) {
		return this.separator() + (text ? this.listItem(ms,text,text,"",false,1,selectable,false) : "")
	}*/

	static headBoxContent(text, numba) {
		return "<span>"+this.circledNumber(numba) + text + "</span>"
	}

	static image(path, key) {
		return path ? `<img src='${path}/${key}.png' style="height:1.4rem; vertical-align: text-bottom;"></img>` : ""	
	}

	static clearButton(id) {
		return `<button id="${id}" type='button'>Reset</button>`
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
