let print = (s) => { // Pov python user moment
    console.log(s); 
}

// Key Presses

let cmdPOpen = false;
let settingsOpen = false;
let detailsOpen = false;
let selected_index = 0;
let max_selected = 0

let toggleDetails = () => {
    let bottom = document.getElementById("bottom");
    bottom.classList.toggle("height-zero");
    document.documentElement.style.setProperty('--bottom-height', detailsOpen ? "0rem" : "2.3rem");
    detailsOpen = !detailsOpen;

    let note = [current_key, note_keys[current_key][1]]
    document.getElementById("details").innerText = `${(new Blob([document.getElementById("textarea").value]).size/1000).toFixed(2)}kB - ${new Date(parseInt(note[1])).toLocaleString().split(", ")[1]} ${new Date(parseInt(note[1])).toDateString().substring(4)} - ${new Date(parseInt(note[0])).toDateString().substring(4)}`
}

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey) {
        switch (e.keyCode) {
            case 75: // K key
                cmdPToggle(e.shiftKey);
                e.preventDefault();
                break;
            case 66: // B Key
                toggleDetails();
                e.preventDefault();
                break;
            case 190: // . Key
                toggle_settings();
                e.preventDefault();
                break;
        }
    } else if (cmdPOpen) {
        switch (e.keyCode) {
            case 27:  // Esc key
                cmdPToggle();
                break;
            case 40: // Down arrow
                e.preventDefault();
                selected_index = Math.min(selected_index + 1, max_selected);
                handleSearch();
                break;
            case 38: // Up Arrow
                e.preventDefault();
                selected_index = Math.max(selected_index - 1, 0);
                handleSearch();
                break;
            default: 
                figureOutWhatToDo(e, selected_index)
                break;

        }
    } else if (settingsOpen) {
        switch (e.keyCode) {
            case 27:  // Esc key
                toggle_settings();
                break;
        }
    }

    // print(e);
});

// DB stuff

let db;
let note_keys = {};
let current_key = localStorage["current_key"];

let open_db = () => {
    const open_request = window.indexedDB.open("main", 1);
    
    open_request.onsuccess = (e) => {
        db = e.target.result;
        updateNoteKeys();
        updateTextArea();
    }

    open_request.onerror = (e) => {
        console.error("Error opening IndexedDB");
        console.error(e);
    }
    
    open_request.onupgradeneeded = (e) => {
        db = e.target.result;
        const storeOS = db.createObjectStore("storage", {keyPath: "key"});
        
        e.target.transaction.oncomplete = (e) => {
            create_note("default");
            current_key = Object.keys(note_keys)[0];
            localStorage["current_key"] = current_key;
        }
    }
}

let writeToStorageNoteKeys = () => {
    let item = {
        "key": "keys",
        "content": note_keys
    }

    const tx = db.transaction("storage", "readwrite");
    const store = tx.objectStore("storage");
    let request = store.put(item);

    request.onerror = (e) => {
        console.error(e);
    }
}

let writeToStorageContent = (key, name, text, edited_data) => {
    let item = {
        "key": key,
        "name": name,
        "content": text,
        "last_edited": edited_data
    }

    const tx = db.transaction("storage", "readwrite");
    const store = tx.objectStore("storage");
    let request = store.put(item);

    request.onerror = (e) => {
        console.error(e);
    }
}

let update_name = (e) => {
    if (e.target.selectionStart == 0 && e.keyCode == 190) {
        e.preventDefault();
        return;
    }

    let name = document.getElementById("current-note-name")
    let v = name.value;


    let request = readFromStorage(current_key)

    request.onsuccess = (e) => {
        result = e.target.result;
        writeToStorageContent(result.key, v, result.content, result.last_edited);
        note_keys[result.key][0] = v;
        writeToStorageNoteKeys();
    }

    request.onerror = (e) => {
        console.error(e);
    }

    if (e.keyCode == 27 || e.keyCode == 13) {
        if (!cmdPOpen) {
            setTimeout(() => {
                document.getElementById("textarea").focus();
            }, 0);
        }
        document.activeElement.blur();
        e.preventDefault();
    }
}

document.getElementById("current-note-name").addEventListener("focusout", (e) => {
    document.getElementById("current-note-name").setSelectionRange(0, 0);
})

let readFromStorage = (key) => {
    const tx = db.transaction("storage", "readwrite");
    const store = tx.objectStore("storage");
    let request = store.get(key);

    return request
}

let deleteFromStorage = (key) => {
    const tx = db.transaction("storage", "readwrite");
    const store = tx.objectStore("storage");
    let request = store.delete(key);

    request.onerror = (e) => {
        console.error(e);
    }
}

let updateStorage = () => {
    let textarea = document.getElementById("textarea");
    let edit = Date.now();
    note_keys[current_key][1] = edit
    writeToStorageContent(current_key, note_keys[current_key][0], textarea.value, edit);
}

let updateTextArea = () => {
    let textarea = document.getElementById("textarea");
    let request = readFromStorage(current_key);

    request.onsuccess = (e) => {
        textarea.value = e.target.result.content;
        document.getElementById("current-note-name").value = note_keys[current_key][0];
        let note = [current_key, note_keys[current_key][1]]
        document.getElementById("details").innerText = `${(new Blob([document.getElementById("textarea").value]).size/1000).toFixed(2)}kB - ${new Date(parseInt(note[1])).toLocaleString().split(", ")[1]} ${new Date(parseInt(note[1])).toDateString().substring(4)} - ${new Date(parseInt(note[0])).toDateString().substring(4)}`
    }

    request.onerror = (e) => {
        console.error(e);
    }
}

let find_default = () => {
    let keys = Object.keys(note_keys).map((e) => { 
        return parseInt(e);
    });

    return Math.min(...keys).toString();
}

let change_current_note = (key) => {
    current_key = key;
    localStorage["current_key"] = current_key;
    updateTextArea();
}

let delete_note = (key) => {
    
    default_key = find_default()
    if (key == default_key) {
        writeToStorageContent(default_key, note_keys[default_key][0], "", Date.now());
        updateTextArea();
        return
    }

    delete note_keys[key]
    deleteFromStorage(key);

    writeToStorageNoteKeys();
    change_current_note(find_default());
}

let create_note = (name) => {
    let key = Date.now().toString();
    let edit = Date.now()
    writeToStorageContent(key, name, "", edit);
    note_keys[key] = [name, edit];
    writeToStorageNoteKeys();

    change_current_note(key);
}

let updateNoteKeys = () => {
    let request = readFromStorage("keys");

    request.onsuccess = (e) => {
        note_keys = e.target.result.content;
        if (localStorage["current_key"] == null) {
            current_key = find_default();
            localStorage["current_key"] = current_key;
        }
    }
}

// Modal 

let cmdPToggle = (shift_key) => {
    let cmdP = document.getElementById("cmdP");
    let inp = document.getElementById("cmdP-input")
    if (cmdP.open) {
        cmdP.close();
        inp.value = ""
        document.activeElement.blur();
        document.getElementById("textarea").focus();
    } else {
        selected_index = 0;
        cmdP.showModal();
        document.activeElement.blur();
        
        if (shift_key) {
            document.getElementById("cmdP-input").value = ">";
        }
        
        handleSearch();

        setTimeout(() => {
            document.getElementById("cmdP-input").focus();
        }, 0);

    }

    cmdP.classList.toggle("hidden");
    cmdPOpen = !cmdPOpen;
}       

let handleSearch = () => {

    if (document.getElementById("cmdP-input").value[0] == ">") {
        document.getElementById("notes-text").innerText = "Commands"
    } else {
        document.getElementById("notes-text").innerText = "Quick Access"
    }

    let notes = findNotes();
    let commands = findCommands();
    let total = [...notes, ...commands];

    if (max_selected == -1) {
        selected_index = 0;
    }
    
    max_selected = total.length - 1;

    if (selected_index > max_selected) {
        selected_index = total.length - 1;
    }

    addToCmdP(total);
}

let findNotes = () => {
    let search = document.getElementById("cmdP-input");
    let notes = [];

    for (let key of Object.keys(note_keys)) {
        if (search.value == "" || note_keys[key][0].includes(search.value)) {
            notes.push([]);
            notes[notes.length - 1].push(key);
            notes[notes.length - 1].push(note_keys[key][0])
            notes[notes.length - 1].push(note_keys[key][1])
        }
    }

    return notes
}

let set_theme = (theme) => {

    let themes = {
        "light":{
            "text": "#0f0f0f",
            "bg": "#f2f3f5",
            "search-bg": "#dfe0e2",
            "selected-bg": "rgba(0, 0, 0, 0.1)",
            "bottom-bg": "#cecece"
        }, 
        "dark": {
            "text": "#cacaca",
            "bg": "#2b2d31",
            "search-bg": "#1c1d1e",
            "selected-bg": "rgba(255, 255, 255, 0.1)",
            "bottom-bg": "#212121"
        }
    }

    let root = document.documentElement;
    for (let key of Object.keys(themes[theme])) {
        root.style.setProperty("--" + key, themes[theme][key]);
    }
}

let switch_theme = () => {
    
    let theme = localStorage["isLightTheme"] == "true" ? "dark" : "light"
    
    set_theme(theme)
    localStorage["isLightTheme"] = (localStorage["isLightTheme"] == "true" ? "false" : "true")

}

let toggle_scrollbar = () => {
    let textarea = document.getElementById("textarea")
    textarea.classList.toggle("hide-scrollbar");

    localStorage["scrollbarActive"] = (localStorage["scrollbarActive"] == "true" ? "false" : "true")
}

let toggle_fullwidth = () => {
    let textarea = document.getElementById("textarea")
    textarea.classList.toggle("small-width");

    localStorage["fullWidth"] = (localStorage["fullWidth"] == "true" ? "false" : "true")
}

let findCommands = () => {
    let search = document.getElementById("cmdP-input")
    let searchCmds = [
        [">toggle theme", `Toggle ${localStorage["isLightTheme"] == "true" ? "Dark" : "Light"} Mode`, switch_theme],
        [">toggle scrollbar", "Toggle Scrollbar", toggle_scrollbar],
        [">toggle small width", `Toggle ${document.getElementById("textarea").classList.contains("small-width") ? "Full" : "Small"} Width`, toggle_fullwidth]
    ];

    let returnCmds = []

    if (search.value != "") {
        if (search.value[0] != ">") {
            returnCmds.push([">create", "Create Note: " + search.value, create_note]);
        }
        
        for (let cmd of searchCmds) {
            if (search.value[0] == ">" && cmd[1].toLowerCase().includes(search.value.substring(1).toLowerCase())) {
                returnCmds.push(cmd);
            }
        }
    }


    return returnCmds 
}

let add_tailwind_classes = (e, classes) => {
    for (let cl of classes) {
        e.classList.add(cl);
    }

    return e;
}

let addToCmdP = (notes) => {
    let notesArea = document.getElementById("notes");

    notesArea.innerHTML = "";

    for (let i = 0; i < notes.length; i++) {
        let note = notes[i];

        let div = document.createElement("div");

        div = add_tailwind_classes(div, [
            "w-full",
            "select-none",
            "flex", 
            "items-center", 
            "flex-wrap",
            "h-11",
            "rounded-lg"
        ])

        if (i == selected_index) {
            div.classList.add("color-selected")
        }
        
        let name = document.createElement("p");
        name.innerText = note[1];
        name = add_tailwind_classes(name, [
            "text-[0.8rem]",
            "my-0", 
            "mx-[0.7rem]",
            "text-ellipsis", 
            "overflow-x-hidden",
            "whitespace-nowrap",
            "w-full"
        ])
        div.appendChild(name);

        if (note[0][0] != ">") {
            let date = document.createElement("p");
            date.innerText = `${new Date(parseInt(note[2])).toLocaleString().split(", ")[1]} ${new Date(parseInt(note[2])).toDateString().substring(4)} - ${new Date(parseInt(note[0])).toDateString().substring(4)}`
            date.classList.add("note-creation-date");
            date = add_tailwind_classes(date, [
                "my-0", 
                "mx-[0.7rem]",
                "text-[0.7rem]",
                "brightness-90"
            ])
            div.appendChild(date);
        }

        notesArea.appendChild(div);
    }

    if (selected_index != -1) {
        notesArea.children[selected_index].scrollIntoView();    
    }
}

let figureOutWhatToDo = (e, selected_index) => {   
    let search = document.getElementById("cmdP-input");
    let total = [...findNotes(), ...findCommands()];
    let selected = total[selected_index];

    if (selected == undefined) {
        return;
    }

    let keyCode = e.keyCode;

    if (keyCode == 13) {
        if (selected[0][0] != ">") {
            change_current_note(selected[0]);
        } else {
            switch (selected[0]) {
                case ">create": 
                    selected[2](search.value);
                    break;
                default:
                    selected[2]();
                    break;
            }
        }
        e.preventDefault();
        cmdPToggle();
    } else if (selected[0][0] != ">" && e.altKey && (keyCode == 46 || keyCode == 8)) {
        e.preventDefault();
        delete_note(selected[0]);
        cmdPToggle();
    }

}

// Tabs 

let add_tab = (e) => {

}

// Settings 

let check_and_set_settings = () => {
    required_settings = [
                        ["isLightTheme", true, switch_theme], 
                        ["scrollbarActive", true, toggle_scrollbar], 
                        ["fullWidth", true, toggle_fullwidth]
                    ]
    for (let setting of required_settings) {
        if (localStorage[setting[0]] == null) {
            localStorage[setting[0]] = setting[1]
        } else if (localStorage[setting[0]] === "false") {
            localStorage[setting[0]] = "true";
            setting[2]();
        }
    }
}

const settings = {
    "Appearance": {
        "Scrollbar": ["Show Scrollbar", "checkmark", localStorage["scrollbarActive"], toggle_scrollbar]
    },
    "Settings Menu 2": {},
    "Settings Menu 3": {},
    "Settings Menu 4": {},
    "Settings Menu 5": {},
    "Settings Menu 6": {},
}

let load_settings_into_settings_page = () => {
    let settings_pages = Object.keys(settings);
    let parent = document.getElementById("settings-list");
    for (let name of settings_pages) {
        let child = document.createElement("p");
        child.classList.add("settings-list-value");
        child.innerText = name;
        parent.appendChild(child);
    }
}

let load_setting_contents_into_settings_page = (shown_settings) => {
    let parent = document.getElementById("")
    for (setting of shown_settings) {
        
    }
}

let toggle_settings = () => {
    let settings = document.getElementById("settings");
    if (settingsOpen) {
        settings.close();
        document.activeElement.blur();
        document.getElementById("textarea").focus();
    } else {
        load_settings_into_settings_page();
        settings.showModal();
        document.activeElement.blur();
        
    }

    settings.classList.toggle("hidden");
    settingsOpen = !settingsOpen
}

// Onload

window.onload = (e) => {

    document.getElementById("textarea").focus();
    check_and_set_settings();

    open_db();
}