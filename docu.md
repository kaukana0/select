# API Overview

- set data
- set/get onSelect
- set/get onSelected
- set/get selected
- get favoriteStar
- get selectedKeys
- set locked
- fractions (attribute)
- set defaultSelections
- selectDefaults()

Note: Properties become attributes.

# usage in html

    <dropdown-box id="selectCountry" multiselect fractions=3 ></dropdown-box>

## multiselect

presence of this attribute makes it multiselect, otherwise it's singleselect

## onSelect vs onSelected

    document.getElementById("selectCountry").onSelected = (key,value) => doSomething(key,value)

- onSelect callback **before** selection is accepted. callback returning true stops everything and suppresses invoking onSelected
- onSelected callback **after** selection has happened

Notes:

- invoked on user interaction
- key/val is from clicked item (the same in both, single- and multiselect mode)

## fractions

- only relevant when favoriteStar is present
- the area in the list is divided vertically in 2 columns: left and right.
    - right column is 1 fraction wide and contains the favoriteStar
    - left column's number of fractions is specified with this attribute.
    - default is 3, so 1 quarter is for the right column
    - the bigger the number, the smaller the right column.
    - just try empirically until it's nice.

# usage in JS

## setting it up

    import "../select/select.mjs"

### setting data

    const d = new Map()
    d.set("EU27_2020", 'European Union')
    d.set("GR", 'Greece')
    d.set("UG", 'Uganda')
    d.set("CO", 'Cordovia')

    var groups = new Map()
    groups.set("GR", {text:"Select all below", selectable:true})

    document.getElementById("selectCountry").data = [d, groups]
    // there will be a separation line after "Greece", with title "Select all below"
    // it will be clickable - like a regular (non group header) item

Note: triggers invocation of onSelected callback.

## getting selections

### the whole thing 

    const selections = document.getElementById("selectCountry").selected
    // type: [{key:val}]  (same in both, single and multiselect mode)

## setting selection

    document.getElementById("selectCountry").selected = ["UG"]

## locked

prohibit user from selecting/deselecting items.

## defaults

    document.getElementById("selectCountry").defaultSelections = ["CO", "UG"]
    document.getElementById("selectCountry").selectDefaults()

now, everything is unselected except Cordovia and Uganda, they're selected.

note: can be set before and after setting data. when setting before, selectDefaults() can be omitted, because the defaults are set while filling the box.