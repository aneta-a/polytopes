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



function createRadioGroup (object, name, defaultValueName = null, eventListener=null, parent = document.body, namesObject = null) {
	var dom = document.createElement("div");
	dom.setAttribute("class", "rgroup");
	for (var f in object) {
		if (object.hasOwnProperty(f)) {
			var labelStr = (namesObject && namesObject.hasOwnProperty(f)) ? namesObject[f] : f;
			addRadio(f, name, dom, eventListener, labelStr);
		}
	}
	parent.appendChild(dom);
	if (defaultValueName) 
		document.getElementById(defaultValueName + name + "rb").setAttribute("checked", "true");
	return dom
}

function createDiv(className) {
	var div = document.createElement("div");
	div.setAttribute("class", className);
	return div;

}

function addRadio(val, name, parentNode, eventListener, labelStr) {
	var div = document.createElement("div");
	div.setAttribute("class", "rb-item");
	var res = document.createElement("input");
	res.setAttribute("type", "radio");
	res.setAttribute("name", name);
	res.setAttribute("value", val);
	var id = val+name+"rb"
	res.setAttribute("id", id);
	var label = document.createElement("label");
	label.setAttribute("class", "radiolabel");
	label.setAttribute("for", id);
	label.innerHTML = labelStr;
	if (eventListener && eventListener instanceof Function) 
		res.addEventListener("change", eventListener);
	else 
		res.addEventListener("change", function (ev) {
					if (onRadioGroupChange && onRadioGroupChange instanceof Function)
						onRadioGroupChange(name, getRBSelectedValue (name)) ;
					else 
						console.warn("Function onRadioGroupChange(nameOfTheGroup, selectedValue) is not implemented")
				});
	div.appendChild(res);
	div.appendChild(label);
	parentNode.appendChild(div);
	return res;
}

function setSlider (name, mn, mx, mnStr, mxStr, startVal, postfix="", parent = document.body) {
	var res = document.createElement("input");
	res.setAttribute("type", "range");
	res.setAttribute("min", mn);
	res.setAttribute("max", mx);
	res.setAttribute("step", (mx-mn)/2000);
	res.setAttribute("value", startVal);
	
	var tr = document.createElement("div");
	tr.setAttribute("class", "slider-block");
	var td1 = document.createElement("div");
	td1.setAttribute("class", "slider-value");
	var valueEl = document.createElement("span")
	valueEl.innerHTML = Number(res.value).toFixed(3) + postfix;
	var valueElPrefix = document.createElement("span");
	valueElPrefix.innerHTML = name + " = ";
	td1.appendChild(valueElPrefix);
	td1.appendChild(valueEl);
	tr.appendChild(td1);
	var td2 = document.createElement("div");
	td2.setAttribute("class", "slider-container");
	var minValueStr = document.createElement("span");
	minValueStr.setAttribute("class", "slider-limit");
	minValueStr.innerHTML = (" " + mnStr? mnStr : mn);
	var maxValueStr = document.createElement("span");
	maxValueStr.innerHTML = (mxStr? mxStr : mx + " ");
	maxValueStr.setAttribute("class", "slider-limit");
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
					var tStart = ev.touches[0];
					var tEnd = null;
					for (var i = 0; i < ev_.changedTouches.length; i++) {
						if (ev_.changedTouches[i].identifier == tStart.identifier) 
							tEnd =  ev_.changedTouches[i];
					}
					if (tEnd &&
						Math.abs(tEnd.clientX - tStart.clientX) + Math.abs(tEnd.clientY - tStart.clientY) < 4) {
						dispatcher.dispatchEvent(new MouseEvent("singletap", tEnd));
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

