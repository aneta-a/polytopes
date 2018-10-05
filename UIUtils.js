/**
* @author Anna Alekseeva
*/


function parseQueryString(){
	var queryString = window.location.search;
	var res = {};
	if (queryString) {
		queryString = queryString.substring(1);
		var params = queryString.split("&");
		for (var i = 0; i < params.length; i++){
			var keyValue = params[i].split("=");
			res[keyValue[0]] = keyValue[1];
		}
			
	}
	return res;
}

function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
        };
      }



function createRadioGroup (object, name, defaultValueName = null, eventListener=null, parent = document.body, layout="horizontal") {
	var dom = document.createElement("div");
	for (var f in object) {
		if (object.hasOwnProperty(f)) {
			addRadio(f, name, dom, eventListener);
			if (layout.toLowerCase().charAt(0) == "v") {
				dom.appendChild(document.createElement("br"));
			}
		}
	}
	parent.appendChild(dom);
	if (defaultValueName) 
		document.getElementById(defaultValueName + name + "rb").setAttribute("checked", "true");
	return dom
}


function addRadio(val, name, parentNode, eventListener) {
	var res = document.createElement("input");
	res.setAttribute("type", "radio");
	res.setAttribute("name", name);
	res.setAttribute("value", val);
	var id = val+name+"rb"
	res.setAttribute("id", id);
	var label = document.createElement("label");
	label.setAttribute("for", id);
	label.innerHTML = val;
	if (eventListener && eventListener instanceof Function) 
		res.addEventListener("change", eventListener);
	else 
		res.addEventListener("change", function (ev) {
					if (onRadioGroupChange && onRadioGroupChange instanceof Function)
						onRadioGroupChange(name, getRBSelectedValue (name)) ;
					else 
						console.warn("Function onRadioGroupChange(nameOfTheGroup, selectedValue) is not implemented")
				});
	parentNode.appendChild(res);
	parentNode.appendChild(label);
	return res;
}

function setSlider (name, mn, mx, mnStr, mxStr, startVal, postfix="", parent = document.body) {
	var res = document.createElement("input");
	res.setAttribute("type", "range");
	res.setAttribute("min", mn);
	res.setAttribute("max", mx);
	res.setAttribute("step", (mx-mn)/2000);
	res.setAttribute("value", startVal);
	var tr = document.createElement("tr");
	tr.setAttribute("valign", "bottom");
	var td1 = document.createElement("td");
	var valueEl = document.createElement("span")
	valueEl.innerHTML = Number(res.value).toFixed(3) + postfix;
	var valueElPrefix = document.createElement("span");
	valueElPrefix.innerHTML = name + " = ";
	td1.appendChild(valueElPrefix);
	td1.appendChild(valueEl);
	tr.appendChild(td1);
	var td2 = document.createElement("td");
	var minValueStr = document.createElement("span");
	minValueStr.innerHTML = (" " + mnStr? mnStr : mn);
	var maxValueStr = document.createElement("span");
	maxValueStr.innerHTML = (mxStr? mxStr : mx + " ");
	td2.appendChild(minValueStr);
	td2.appendChild(res);
	td2.appendChild(maxValueStr);
	tr.appendChild(td2);
	parent.appendChild(tr);
	res.updateValueOutput = function () {
		valueEl.innerHTML = Number(res.value).toFixed(3) + postfix;
	}
	res.addEventListener("change", function (ev) {res.updateValueOutput();});
	return res;
}


function getRBSelectedValue (name) {
	var radioButtons = document.getElementsByName(name);
	var val;
	for (var i = 0; i < radioButtons.length; i++){
		if (radioButtons[i].checked) { 
			val = radioButtons[i].value;
			break;
		}
	}
	return val;
}

function addSingleClickListener(listener, dispatcher = document) {
	dispatcher.addEventListener("mousedown", function (ev) {
				
				function upListener (ev_) {
					if (Math.abs(ev_.clientX - ev.clientX) + Math.abs(ev_.clientY - ev.clientY) < 4) {
						dispatcher.dispatchEvent(new MouseEvent("singleclick", ev_));
					}
					dispatcher.removeEventListener("mouseup", upListener);
				};
				dispatcher.addEventListener("mouseup", upListener);
	});
	dispatcher.addEventListener("singleclick", listener);	
	
}

function addSingleTapListener(listener, dispatcher = document) {
	dispatcher.addEventListener("touchstart", function (ev) {
				
				function upListener (ev_) {
					if (ev_.touches.length == 1 &&
						Math.abs(ev_.touches[0].clientX - ev.touches[0].clientX) + Math.abs(ev_.touches[0].clientY - ev.touches[0].clientY) < 4) {
						dispatcher.dispatchEvent(new MouseEvent("singletap", ev_.touches[0]));
					}
					dispatcher.removeEventListener("touchend", upListener);
				};
				if (ev.touches.length == 1)
					dispatcher.addEventListener("touchend", upListener);
	});
	dispatcher.addEventListener("singletap", listener);	
	
}


function copyObject(source, res) {
	if (!res) res = {};
	for (var f in source) {
		if (source.hasOwnProperty(f)) {
			if (source[f] instanceof Object) {
				if (!res.hasOwnProperty(f)) res[f]={};
				copyObject(source[f], res[f]);}
			else res[f] = source[f];
		}
	}
	return res;
}

console.log("UIUtils loaded");

