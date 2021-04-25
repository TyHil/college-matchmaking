//Firebase configuration
let firebaseConfig = {
  apiKey: "AIzaSyB-vU0SztGZ7O1pcoEw50FM481-AAEJP7g",
  authDomain: "collegematchmaking.firebaseapp.com",
  databaseURL: "https://collegematchmaking-default-rtdb.firebaseio.com",
  projectId: "collegematchmaking",
  storageBucket: "collegematchmaking.appspot.com",
  messagingSenderId: "129151756657",
  appId: "1:129151756657:web:b4e806d1996dc46b3c2ed0",
};
//Firebase initialization
firebase.initializeApp(firebaseConfig);
firebase.analytics();
const databaseRef = firebase.database().ref();

highlightColors = ["#E67C73", "#F9AD66", "#FFD666", "#AFCF6F", "#57BB8A"];

function loadJSON(link) {//load local or external json
  return new Promise(function (resolve, reject) {
    let xhr = new XMLHttpRequest();
    //xhr.overrideMimeType("application/json");
    xhr.open("GET", link, true);
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        resolve(this.responseText);
      } else if (this.readyState == 4 && this.status != 200) {
        reject(Error(xhr.statusText));
      }
    };
    xhr.onerror = function () {
      reject(Error("Network Error"));
    };
    xhr.send(null);
  });
}

let allLoaded = [];//when headers and scores loaded

let headers;
let headersLoaded = loadJSON("./headers.json").then(response => {//load headers for table from headers.json
  headers = JSON.parse(response);
  let table = document.getElementById("table");
  let categorytr = document.createElement("tr");
  let datatr = document.createElement("tr");
  for (const category in headers) {
    let categoryth = document.createElement("th");
    categoryth.innerHTML = category;
    if (Array.isArray(headers[category])) {
      categoryth.rowSpan = 2;
    } else {
      let length = 0;
      for (const key in headers[category]) {
        let datath = document.createElement("th");
        datath.innerHTML = key;
        datath.classList.add(category);
        datath.classList.add(headers[category][key][0]);
        datatr.appendChild(datath);
        length++;
      }
      categoryth.colSpan = length;
    }
    categoryth.classList.add(category);
    categorytr.appendChild(categoryth);
  }
  table.appendChild(categorytr);
  table.appendChild(datatr);
}, error => {
  console.error("Load Headers Failed!", error);
});
allLoaded.push(headersLoaded);

let scores = [];//scores float, sail, and swim scores.
let scoreNames = ["FloatScore", "SailScore", "SwimScore"];

for (let i = 0; i < scoreNames.length; i++) {//load all scores
  let scoreLoaded = loadJSON("./UserData/" + scoreNames[i] + ".json").then(response => {
    scores[i] = JSON.parse(response);
  }, error => {
    console.error("Load " + scoreNames[i] + " Failed!", error);
  });
  allLoaded.push(scoreLoaded);
}

let colleges;//users list of colleges
let collegesData = {};//locally stored college data
let collegesLoaded = loadJSON("./UserData/colleges.json").then(response => {
  colleges = JSON.parse(response);
}, error => {
  console.error("Load College List Failed!", error);
});
allLoaded.push(collegesLoaded);

/*function generateLink(college, score) {
  let link = "https://webapi.tylerghill.repl.co/match/";
  let datas = "";
  let orders = "";
  let weights = "";
  for (const category in scores[score]) {
    for (const key in scores[score][category]) {
      if (scores[score][category][key][1] != 0) {
        datas += key + ",";
        orders += scores[score][category][key][0] + ",";
        weights += scores[score][category][key][1] + ",";
      }
    }
  }
  return "https://webapi.tylerghill.repl.co/match/" + college + "/?datas=" + datas.slice(0, -1) + "&orders=" + orders.slice(0, -1) + "&weights=" + weights.slice(0, -1);
}*/

function updateRowMatchScores(college) {
  let floatScore;
  for (let i = 0; i < scoreNames.length; i++) {//update match scores
    let scoreTot = 0;
    let weightSumTot = 0;
    for (const category in scores[i]) {
      let scoreCat = 0;
      let weightSumCat = 0;
      for (const key in scores[i][category][1]) {
        if (key in collegesData[college]) {
          const data = collegesData[college][key];
          let scoreDat = 0;
          const weight = scores[i][category][1][key][0];
          let range = scores[i][category][1][key][1];
          let scoreVals = [1, 2, 3, 4, 5];
          if (range.length == 3) {//custom score ordering defined
            scoreVals = scores[i][category][1][key][2];
          }
          if (range[1].length == 2) {//min and max defined
            range = [range[0], (2 * range[0] + range[1]) / 3, (range[0] + 2 * range[1]) / 3, range[1]]
          }
          if (data <= range[0]) {
            scoreDat = scoreVals[0];
          }
          for (let j = 0; j < 3; j++) {
            if (range[i] < data && data <= range[i + 1]) {
              scoreDat = scoreVals[i + 1];
            }
          }
          if (range[3] < data) {
            scoreDat = scoreVals[4];
          }
          scoreCat += scoreDat * weight;
          weightSumCat += weight;
          document.getElementById(college).getElementsByClassName(key)[0].style.backgroundColor = highlightColors[scoreDat - 1];//cell highlights
        }
      }
      scoreTot += scoreCat / Math.max(weightSumCat, 1) * scores[i][category][0];
      weightSumTot += scores[i][category][0];
    }
    let score;
    if (i == 0) {
      floatScore = (scoreTot / weightSumTot - 1) / 4;
      score = (scoreTot / weightSumTot - 1) / 4;
    } else {
      score = ((scoreTot / weightSumTot - 1) / 4 + 4 * floatScore) / 5;//4:1
    }
    document.getElementById(college).getElementsByClassName(scoreNames[i])[0].innerHTML = Math.round(score * 10000) / 100 + "%";
    document.getElementById(college).getElementsByClassName(scoreNames[i])[0].style.backgroundColor = highlightColors[Math.trunc(score * 5)];
  }
}

function updateRowData(college) {
  databaseRef.child("/colleges/" + college).get().then((snapshot) => {//main data
    if (snapshot.exists()) {
      let response = snapshot.val();//JSON.parse(response);
      collegesData[college] = response;
      for (const category in headers) {//update data in table
        if (category == "Notes") {
          document.getElementById(college).getElementsByClassName("Notes")[0].innerHTML = colleges[college];
        } else if (category != "Actions") {
          for (const key in headers[category]) {
            let fill = "No Data";
            if (headers[category][key][0] in response) {//format numbers
              fill = response[headers[category][key][0]];
              if (headers[category][key][1] == "Integer" || headers[category][key][1] == "$") {
                fill = fill.toLocaleString();
                if (headers[category][key][1] == "$") {
                  fill = "$" + fill;
                }
              } else if (headers[category][key][1] == "%") {
                fill = Math.round(fill * 10000) / 100 + "%";
              } else if (headers[category][key][1] == "Degree") {
                fill = Math.round(fill * 100) / 100 + "°F";
              }
            }
            document.getElementById(college).getElementsByClassName(headers[category][key][0])[0].innerHTML = fill;
          }
        }
      }
      updateRowMatchScores(college);
    } else {
      console.log("No data available");
    }
  }).catch((error) => {
    console.error(error);
  });
}

function addRowToTable(college) {
  let tr = document.createElement("tr");
  tr.setAttribute("id", college);
  for (const category in headers) {
    if (category == "Actions") {
      let td = document.createElement("td");
      td.classList.add(category);
      remove = document.createElement("img");
      remove.classList.add("removeicon");
      remove.src = "./icons/remove.svg";
      remove.addEventListener("click", () => {
        document.getElementById(college).remove();
        delete colleges[college];
      });
      td.appendChild(remove);
      tr.appendChild(td);
    } else if (category == "Notes") {
      let td = document.createElement("td");
      td.classList.add(category);
      td.contentEditable = "true";
      td.addEventListener("keyup", function () {
        colleges[college] = this.innerHTML;
      });
      tr.appendChild(td);
    } else {
      for (const key in headers[category]) {
        let td = document.createElement("td");
        td.classList.add(category);
        td.classList.add(headers[category][key][0]);
        tr.appendChild(td);
      }
    }
  }
  table.appendChild(tr);
  updateRowData(college);
}

Promise.all(allLoaded).then(function () {//when headers, scores, and colleges are loaded
  for (const college in colleges) {
    addRowToTable(college);
  }
});

document.getElementById("textinput").addEventListener("keyup", function (event) {//text box suggestion generator
  if (this.value != "") {
    document.getElementById("suggestions").innerHTML = "Loading...";
    loadJSON("https://webapi.tylerghill.repl.co/closeststr/" + this.value + "/10").then(response => {
      response = JSON.parse(response);
      if (event.keyCode === 13) {
        if (document.getElementById(response[0][0]) == null) {
          document.getElementById("suggestions").innerHTML = "";
          colleges[response[0][0]] = "";
          addRowToTable(response[0][0]);
        } else {
          window.alert("College already exists.");
        }
      } else {
        document.getElementById("suggestions").innerHTML = "Suggestions: " + JSON.stringify(response);
      }
    }, error => {
      document.getElementById("suggestions").innerHTML = "Failed.";
      console.error("Load Suggestions Failed!", error);
    });
  }
});