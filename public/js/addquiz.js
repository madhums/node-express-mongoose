createQuizBox() {

  let x = document.getElementById("quiznumber");
  let length = parseInt(x.value)

  let toAdd = document.createDocumentFragment();

  for(let i = 0; i < length; i++) {
    let newDiv = document.createElement('div');
   	newDiv.id = 'r'+i;
    newDiv.innerHTML = 'i = ' + i
   	toAdd.appendChild(newDiv);
  }

  let myNode = document.getElementById("theDiv");
	while (myNode.firstChild) {
    	myNode.removeChild(myNode.firstChild);
	}

  document.getElementById('theDiv').appendChild(toAdd);

}
