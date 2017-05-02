function createQuizBox() {

  let x = document.getElementById("quiznumber");
  let length = parseInt(x.value)

  document.getElementById('numbers').value = length

  let toAdd = document.createDocumentFragment();

  for(let i = 0; i < length && length <= 20; i++) {

    let num = i + 1

    let newDiv = document.createElement('div');
   	newDiv.id = 'div' + num;

      let newQuestionDiv = document.createElement('div');
     	newQuestionDiv.id = 'q' + num + 'div';
      newQuestionDiv.innerHTML = 'คำถามข้อที่ ' + num + ' : '

        let newQuestion = document.createElement('input');
        newQuestion.id = 'q' + num
        newQuestion.name = 'q' + num
        newQuestion.type = 'text'
        newQuestion.size = 50

      newQuestionDiv.appendChild(newQuestion)
      newQuestionDiv.appendChild(document.createElement('br'))
      newQuestionDiv.appendChild(document.createElement('br'))

    newDiv.appendChild(newQuestionDiv)

      let choiceDiv = document.createElement('div');
      choiceDiv.id = 'choiceq' + num + 'div';

        // choice 1
        let choice1Div = document.createElement('div')
        choice1Div.id = 'choice1Divq' + num
        choice1Div.style = 'padding: 0px 0px 0px 10px;'
        choice1Div.innerHTML = 'ตัวเลือกที่ 1 : '

          let choice1 = document.createElement('input');
          choice1.id = 'q' + num + 'c1'
          choice1.name = 'q' + num + 'c1'
          choice1.type = 'text'
          choice1.size = 50

        choice1Div.appendChild(choice1)
        choice1Div.appendChild(document.createElement('br'))

        //choice 2
        let choice2Div = document.createElement('div')
        choice2Div.id = 'choice2Divq' + num
        choice2Div.style = 'padding: 0px 0px 0px 10px;'
        choice2Div.innerHTML = 'ตัวเลือกที่ 2 : '

          let choice2 = document.createElement('input');
          choice2.id = 'q' + num + 'c2'
          choice2.name = 'q' + num + 'c2'
          choice2.type = 'text'
          choice2.size = 50

        choice2Div.appendChild(choice2)
        choice2Div.appendChild(document.createElement('br'))

        //choice 3
        let choice3Div = document.createElement('div')
        choice3Div.id = 'choice3Divq' + num
        choice3Div.style = 'padding: 0px 0px 0px 10px;'
        choice3Div.innerHTML = 'ตัวเลือกที่ 3 : '

          let choice3 = document.createElement('input');
          choice3.id = 'q' + num + 'c3'
          choice3.name = 'q' + num + 'c3'
          choice3.type = 'text'
          choice3.size = 50

        choice3Div.appendChild(choice3)
        choice3Div.appendChild(document.createElement('br'))

        //choice 4
        let choice4Div = document.createElement('div')
        choice4Div.id = 'choice4Divq' + num
        choice4Div.style = 'padding: 0px 0px 0px 10px;'
        choice4Div.innerHTML = 'ตัวเลือกที่ 4 : '

          let choice4 = document.createElement('input');
          choice4.id = 'q' + num + 'c4'
          choice4.name = 'q' + num + 'c4'
          choice4.type = 'text'
          choice4.size = 50

        choice4Div.appendChild(choice4)
        choice4Div.appendChild(document.createElement('br'))

        //answer
        let answerDiv = document.createElement('div')
        answerDiv.id = 'q' + num + 'answer'
        answerDiv.style = 'padding: 0px 0px 0px 10px;'
        answerDiv.innerHTML = 'คำตอบ : '

          let answer = document.createElement('input');
          answer.id = 'q' + num + 'ans'
          answer.name = 'q' + num + 'ans'
          answer.type = 'text'

        answerDiv.appendChild(answer)
        answerDiv.appendChild(document.createElement('br'))
        answerDiv.appendChild(document.createElement('br'))
        answerDiv.appendChild(document.createElement('br'))

      choiceDiv.appendChild(choice1Div)
      choiceDiv.appendChild(choice2Div)
      choiceDiv.appendChild(choice3Div)
      choiceDiv.appendChild(choice4Div)
      choiceDiv.appendChild(answerDiv)

    newDiv.appendChild(choiceDiv)
    //newDiv.appendChild(answer)
    toAdd.appendChild(newDiv);

  }

  let myNode = document.getElementById("theDiv");
	while (myNode.firstChild) {
    	myNode.removeChild(myNode.firstChild);
	}

  document.getElementById('theDiv').appendChild(toAdd);

}
