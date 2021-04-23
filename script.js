function loadJSON(link) {//load local or external json
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
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

var allLoaded = [];//when headers and scores loaded

var headers;
var headersLoaded = loadJSON("./headers.json").then(response => {//load headers for table from headers.json
  headers = JSON.parse(response);
  var table = document.getElementById("table");
  var categorytr = document.createElement("tr");
  var datatr = document.createElement("tr");
  for (const category in headers) {
    var categoryth = document.createElement("th");
    categoryth.innerHTML = category;
    if (Array.isArray(headers[category])) {
      categoryth.rowSpan = 2;
    } else {
      var length = 0;
      for (const key in headers[category]) {
        var datath = document.createElement("th");
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

var scores = [];//scores float, sail, and swim scores.
var scoreNames = ["FloatScore", "SailScore", "SwimScore"];

for (let i = 0; i < scoreNames.length; i++) {//load all scores
  var scoreLoaded = loadJSON("./UserData/" + scoreNames[i] + ".json").then(response => {
    scores[i] = JSON.parse(response);
  }, error => {
    console.error("Load " + scoreNames[i] + " Failed!", error);
  });
  allLoaded.push(scoreLoaded);
}

var colleges;//users list of colleges
var collegesLoaded = loadJSON("./UserData/colleges.json").then(response => {
  colleges = JSON.parse(response);
}, error => {
  console.error("Load College List Failed!", error);
});
allLoaded.push(collegesLoaded);

function generateLink(college, score) {
  var link = "https://webapi.tylerghill.repl.co/match/";
  var datas = "";
  var orders = "";
  var weights = "";
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
}

function updateRowData(college) {
  loadJSON("https://webapi.tylerghill.repl.co/college/" + college).then(response => {//main data
    response = JSON.parse(response);
    //collegesData[college] = response;
    for (const category in headers) {//update data in table
      if (category == "Notes") {
        document.getElementById(college).getElementsByClassName("Notes")[0].innerHTML = colleges[college];
      } else {
        for (const key in headers[category]) {
          if (headers[category][key][0] in response) {
            var fill = response[headers[category][key][0]];
            if (fill == "NULL") {//format numbers
              fill = "No Data";
            } else {
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
    }

    for (var i = 0; i < scoreNames.length; i++) {//update match scores
      var scoreTot = 0;
      var weightSumTot = 0;
      for (const category in scores[i]) {
        var scoreCat = 0;
        var weightSumCat = 0;
        var weight = scores[i][category][0];
        for (const key in scores[i][category][1]) {
          const data = response[key];
          if (data != "NULL") {
            var scoreDat = 0;
            const range = scores[i][category][1][key];
            var scoreVals = [1, 2, 3, 4, 5];
            if (range.length == 3) {//custom score ordering defined
              scoreVals = range[2];
            }
            if (range[1].length == 2) {//min and max defined
              scoreDat = Math.min(Math.max(4 * (data - range[1][0]) / (range[1][1] - range[1][0]) + 1, 1), 5);
            } else {//ranges defined
              if (data <= range[1][0]) {
                scoreDat = scoreVals[0];
              }
              for (var j = 0; j < 3; j++) {
                if (range[1][i] < data && data <= range[1][i + 1]) {
                  scoreDat = scoreVals[i + 1];
                }
              }
              if (range[1][3] < data) {
                scoreDat = scoreVals[4];
              }
            }
            scoreCat += scoreDat * range[0];
            weightSumCat += range[0];
          }
        }
        scoreTot += scoreCat / Math.max(weightSumCat, 1) * scores[i][category][0];
        weightSumTot += scores[i][category][0];
      }
      document.getElementById(college).getElementsByClassName(scoreNames[i])[0].innerHTML = Math.round((scoreTot / weightSumTot - 1) / 4 * 10000) / 100 + "%";
    }
  }, error => {
    console.error("Load " + college + " Data Failed!", error);
  });
}

function addRowToTable(college) {
  var tr = document.createElement("tr");
  tr.setAttribute("id", college);
  for (const category in headers) {
    if (category == "Actions") {
      var td = document.createElement("td");
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
      var td = document.createElement("td");
      td.classList.add(category);
      td.contentEditable = "true";
      td.addEventListener("keyup", function () {
        colleges[college] = this.innerHTML;
      });
      tr.appendChild(td);
    } else {
      for (const key in headers[category]) {
        var td = document.createElement("td");
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
      var response = JSON.parse(response);
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
