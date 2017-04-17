function createQuizBox() {

  let x = document.getElementById("quiznumber");
  let length = parseInt(x.value)

  let toAdd = document.createDocumentFragment();

  for(let i = 0; i < length; i++) {

    /*
    let newDiv = document.createElement('div');
   	newDiv.id = 'r'+i;
    newDiv.innerHTML = 'i = ' + i
   	toAdd.appendChild(newDiv);
    */
    let num = i + 1

    let newDiv = document.createElement('div');
   	newDiv.id = 'div' + num;
    newDiv.innerHTML = 'num = ' + num

    let newQuestion = document.createElement('input');
    newQuestion.id = 'q' + num
    newQuestion.type = 'text'

    let choice1 = document.createElement('input');
    choice1.id = 'q' + num + 'c1'
    choice1.type = 'text'

    let choice2 = document.createElement('input');
    choice2.id = 'q' + num + 'c2'
    choice2.type = 'text'

    let choice3 = document.createElement('input');
    choice3.id = 'q' + num + 'c3'
    choice3.type = 'text'

    let answer = document.createElement('input');
    answer = 'q' + num + 'ans'
    answer.type = 'text'

    newDiv.appendChild(newQuestion)
    newDiv.appendChild(choice1)
    newDiv.appendChild(choice2)
    newDiv.appendChild(choice3)
    //newDiv.appendChild(answer)

    toAdd.appendChild(newDiv);

  }

  let myNode = document.getElementById("theDiv");
	while (myNode.firstChild) {
    	myNode.removeChild(myNode.firstChild);
	}

  document.getElementById('theDiv').appendChild(toAdd);

}
