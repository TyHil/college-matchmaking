//Donation button configuration
window.DonorBox = { widgetLinkClassName: 'custom-dbox-popup' }
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
let ui = new firebaseui.auth.AuthUI(firebase.auth());

function singedIn(loadData) {
  loggedIn = 1;
  document.getElementById("login").style.display = "none";
  img = document.createElement("img");
  img.id = "userimg";
  if (firebase.auth().currentUser.photoURL == null) {
    img.src = "icons/profile.svg";
  } else {
    img.src = firebase.auth().currentUser.photoURL;
  }
  img.addEventListener("click", () => {
    let userinfo = document.getElementById("userinfo");
    if (userinfo.style.display == "flex") {
      userinfo.style.display = "none";
    } else {
      userinfo.style.display = "flex";
    }
  });
  document.addEventListener('click', function (e) {
    let userinfo = document.getElementById("userinfo");
    if (!userinfo.contains(e.target) && !document.getElementById("userimg").contains(e.target)) {
      userinfo.style.display = "none";
    }
  });
  let userinfo = document.getElementById("userinfo");
  document.getElementById("headerright").appendChild(img);
  userinfo.getElementsByTagName("h2")[0].innerHTML = firebase.auth().currentUser.displayName;
  userinfo.getElementsByTagName("h3")[0].innerHTML = firebase.auth().currentUser.email;
  document.getElementById("reset").addEventListener("click", function () {
    let confirmmodal = document.getElementById("confirmmodal");
    confirmmodal.getElementsByTagName("h1")[0].innerHTML = "Confirm Match Score Reset";
    confirmmodal.getElementsByTagName("p")[0].innerHTML = "This will remove all customization from your match scores and return them to their default state.";
    confirmmodal.style.display = "block";
    document.getElementById("confirm").onclick = function () {
      let score0Loaded = loadJSON("./UserData/" + scoreNames[0] + ".json").then(response => {
        scores[0] = JSON.parse(response);
        writeUserData();
        setSliders();
        for (const college in colleges) {
          updateRowMatchScores(college);
        }
      }, error => {
        console.error("Load " + scoreNames[0] + " Failed!", error);
      });
      confirmmodal.style.display = "none";
    };
    document.getElementById("cancel").addEventListener("click", function () {
      document.getElementById("confirm").onclick = '';
      confirmmodal.style.display = "none";
    }, { once: true });
    confirmmodal.getElementsByClassName("close")[0].addEventListener("click", function () {
      document.getElementById("confirm").onclick = '';
      confirmmodal.style.display = "none";
    });
    document.addEventListener('click', function (e) {
      if (e.target == confirmmodal) {
        document.getElementById("confirm").onclick = '';
        confirmmodal.style.display = "none";
      }
    });
  });
  document.getElementById("logout").addEventListener("click", function () {
    firebase.auth().signOut().then(() => {
      location.reload();
    }).catch((error) => {
      console.error(error);
    });
  });
  document.getElementById("deleteaccnt").addEventListener("click", function () {
    let confirmmodal = document.getElementById("confirmmodal");
    confirmmodal.getElementsByTagName("h1")[0].innerHTML = "Confirm Delete Account";
    confirmmodal.getElementsByTagName("p")[0].innerHTML = "This delete your account with College Matchmaking and all of it's associated data.";
    confirmmodal.style.display = "block";
    document.getElementById("confirm").onclick = function () {
      firebase.auth().currentUser.reauthenticateWithPopup(new firebase.auth.GoogleAuthProvider())
        .then((UserCredential) => {
          firebase.database().ref('/users/' + firebase.auth().currentUser.uid).remove();
          firebase.auth().currentUser.delete().then(function () {
            location.reload();
          }).catch(function (error) {
            console.error(error);
          });
        });
    };
    document.getElementById("cancel").addEventListener("click", function () {
      document.getElementById("confirm").onclick = '';
      confirmmodal.style.display = "none";
    }, { once: true });
    confirmmodal.getElementsByClassName("close")[0].addEventListener("click", function () {
      document.getElementById("confirm").onclick = '';
      confirmmodal.style.display = "none";
    });
    document.addEventListener('click', function (e) {
      if (e.target == confirmmodal) {
        document.getElementById("confirm").onclick = '';
        confirmmodal.style.display = "none";
      }
    });
  });
  if (loadData) {
    let scoresLoaded = loadFirebaseJSON("/users/" + firebase.auth().currentUser.uid).then(response => {
      for (const college in colleges) {
        document.getElementById(college).remove();
      }
      colleges = response["colleges"];
      collegesData = {};
      for (const college in colleges) {
        addRowToTable(college);
      }
      scores[0] = response[scoreNames[0]];
    }, error => {
      console.error("Load User Data Failed!", error);
    });
    allLoaded.push(scoresLoaded);
  }
}

let uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function (authResult) {//User successfully signed in.
      document.getElementById("loginmodal").style.display = "none";
      if (authResult.additionalUserInfo.isNewUser) {
        writeUserData();
      }
      signedIn(!authResult.additionalUserInfo.isNewUser);
    },
    uiShown: function () { // The widget is rendered.
      document.getElementById("loginmodal").getElementsByTagName("h1")[0].innerHTML = "Sign In or Sign Up";
    }
  },
  signInFlow: 'popup',
  signInOptions: [
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
    firebase.auth.GoogleAuthProvider.PROVIDER_ID
  ],
  // Terms of service url.
  tosUrl: '<your-tos-url>',
  // Privacy policy url.
  privacyPolicyUrl: '<your-privacy-policy-url>'
};

function writeUserData() {
  firebase.database().ref('/users/' + firebase.auth().currentUser.uid).set({
    colleges: colleges,
    FloatScore: scores[0],
  });
}

let loginmodal = document.getElementById("loginmodal");
document.getElementById("login").addEventListener("click", event => {
  if (!ui.isPendingRedirect()) {
    loginmodal.style.display = "block";
    ui.start('#firebaseui-auth-container', uiConfig);
  }
});
loginmodal.getElementsByClassName("close")[0].onclick = function () {
  loginmodal.style.display = "none";
}
document.addEventListener('click', function (e) {
  for (modal of document.getElementsByClassName("modal")) {
    if (e.target == modal) {
      modal.style.display = "none";
    }
  }
  let datachanges = document.getElementsByClassName("datachange");
  if (datachanges.length != 0) {
    let plusBool = 0;
    for (const plus of document.getElementsByClassName("plus")) {
      if (plus.contains(e.target)) {
        plusBool = 1;
      }
    }
    let sliderBool = 0;
    for (const slider of document.querySelectorAll('.slider:not(.vert)')) {
      if (slider.contains(e.target)) {
        sliderBool = 1;
      }
    }
    let datachangeBool = 0;
    for (const datachange of datachanges) {
      if (datachange.contains(e.target)) {
        datachangeBool = 1;
      }
    }
    if (!datachangeBool && !sliderBool && !plusBool) {
      while (datachanges.length) {
        datachanges[0].remove();
      }
      writeUserData();
      for (const college in colleges) {
        updateRowMatchScores(college);
      }
    }
  }
});

let loggedIn = 0;
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    singedIn(1);
  } else {
    let intromodal = document.getElementById("intromodal");
    intromodal.style.display = "block";
    intromodal.getElementsByClassName("close")[0].onclick = function () {
      intromodal.style.display = "none";
    }
  }
});

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

function loadFirebaseJSON(link) {
  return new Promise(function (resolve, reject) {
    databaseRef.child(link).get().then((snapshot) => {
      if (snapshot.exists()) {
        resolve(snapshot.val());
      } else {
        reject("No data available");
      }
    }).catch((error) => {
      reject(error);
    });
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
    let h2 = document.createElement("h2");
    h2.innerHTML = category
    categoryth.appendChild(h2);
    if (Array.isArray(headers[category])) {
      categoryth.rowSpan = 2;
    } else {
      let length = 0;
      for (const key in headers[category]) {
        let datath = document.createElement("th");
        let h3 = document.createElement("h3");
        h3.innerHTML = key
        datath.appendChild(h3);
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
          if (scores[i][category][1][key].length == 3) {//custom score ordering defined
            scoreVals = scores[i][category][1][key][2];
          }
          if (range.length == 2) {//min and max defined
            let width = (range[1] - range[0]) / 5;
            range = [range[0] + width, range[0] + 2 * width, range[1] - 2 * width, range[1] - width];
          }
          if (data <= range[0]) {
            scoreDat = scoreVals[0];
          }
          for (let j = 0; j < 3; j++) {
            if (range[j] < data && data <= range[j + 1]) {
              scoreDat = scoreVals[i + 1];
            }
          }
          if (range[3] < data) {
            scoreDat = scoreVals[4];
          }
          scoreCat += scoreDat * weight;
          weightSumCat += 5 * weight;
          if (i == 0) {
            document.getElementById(college).getElementsByClassName(key)[0].style.backgroundColor = highlightColors[scoreDat - 1];//cell highlights
          }
        }
      }
      if (weightSumCat != 0) {
        scoreTot += scoreCat / weightSumCat * scores[i][category][0];
      }
      weightSumTot += scores[i][category][0];
    }
    let score;
    if (i == 0) {
      score = scoreTot / weightSumTot;
      floatScore = score;
    } else {
      score = (scoreTot / weightSumTot + 4 * floatScore) / 5;
    }
    document.getElementById(college).getElementsByClassName(scoreNames[i])[0].innerHTML = Math.round(score * 10000) / 100 + "%";
    document.getElementById(college).getElementsByClassName(scoreNames[i])[0].style.backgroundColor = highlightColors[Math.trunc(score * 5)];//score highlight
  }
}

function updateRowData(college) {
  loadFirebaseJSON("/colleges/" + college).then(response => {
    collegesData[college] = response;
    for (const category in headers) {//update data in table
      if (category == "Notes") {
        document.getElementById(college).getElementsByClassName("Notes")[0].getElementsByTagName("textarea")[0].value = colleges[college];
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
  }, error => {
    console.error("Load " + college + " Data Failed!", error);
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
      let textarea = document.createElement("textarea");
      textarea.maxlength = "10";
      textarea.addEventListener("blur", function () {
        colleges[college] = this.value;
        if (loggedIn) {
          writeUserData();
        }
      });
      td.appendChild(textarea);
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

function setSliders() {
  for (const category in scores[0]) {
    let cell = document.getElementsByClassName(category)[0];
    cell.getElementsByClassName("slider")[0].value = scores[0][category][0];
    cell.getElementsByClassName("weight")[0].innerHTML = "Weight: " + scores[0][category][0];
    for (const key in scores[0][category][1]) {
      let cell = document.getElementsByClassName(key)[0];
      cell.getElementsByClassName("slider")[0].value = scores[0][category][1][key][0];
      cell.getElementsByClassName("weight")[0].innerHTML = "Weight: " + scores[0][category][1][key][0];
    }
  }
}

function createSlider(nameClass, val) {
  let div = document.createElement("div");
  div.classList.add("scorecontrol");
  let weight = document.createElement("p");
  weight.classList.add("weight");
  weight.innerHTML = "Weight: " + val;
  div.appendChild(weight);
  let range = document.createElement("input");
  range.type = "range";
  range.min = "0";
  range.max = "5"
  range.value = val;
  range.classList.add("slider");
  range.addEventListener("input", function () {
    this.parentElement.getElementsByTagName("p")[0].innerHTML = "Weight: " + this.value;
  });
  div.appendChild(range);
  div.style.width = "100px";
  document.getElementsByClassName(nameClass)[0].appendChild(div);
  return range;
}

Promise.all(allLoaded).then(function () {//when headers, scores, and colleges are loaded
  for (const college in colleges) {
    addRowToTable(college);
  }
  for (const category in scores[0]) {
    createSlider(category, scores[0][category][0]).addEventListener("change", function () {
      scores[0][category][0] = parseInt(this.value);
      for (const college in colleges) {
        updateRowMatchScores(college);
      }
      if (loggedIn) {
        writeUserData();
      }
    });
    for (const key in scores[0][category][1]) {
      let range = createSlider(key, scores[0][category][1][key][0]);
      range.addEventListener("change", function () {
        scores[0][category][1][key][0] = parseInt(this.value);
        for (const college in colleges) {
          updateRowMatchScores(college);
        }
        if (loggedIn) {
          writeUserData();
        }
      });
      let plus = document.createElement("img");
      plus.classList.add("plus");
      plus.src = "icons/plus.svg";
      plus.addEventListener("click", function () {
        let scoreVals = [1, 2, 3, 4, 5];
        if (scores[0][category][1][key].length == 3) {//custom score ordering defined
          scoreVals = scores[0][category][1][key][2];
        }

        let datachange = document.createElement("div");
        datachange.classList.add("popup");
        datachange.classList.add("datachange");

        let body = document.body;
        let html = document.documentElement;
        datachange.style.top = this.getBoundingClientRect().y + this.height + 30 + (window.pageYOffset || html.scrollTop || body.scrollTop || 0) + "px";
        datachange.style.left = this.parentElement.getBoundingClientRect().x + (window.pageXOffset || html.scrollLeft || body.scrollLeft || 0) + "px";

        let h2 = document.createElement("h2");
        h2.innerHTML = "Change Range";
        datachange.appendChild(h2);
        let h3 = document.createElement("h3");
        h3.innerHTML = "Redefine what makes a good score.";
        datachange.appendChild(h3);
        let dropdown = document.createElement("select");
        dropdown.classList.add("dropdown");
        let short = document.createElement("option");
        short.value = "short";
        short.innerHTML = "Short Range";
        if (scores[0][category][1][key][1].length == 2) {
          short.selected = "selceted";
        }
        dropdown.appendChild(short);
        let long = document.createElement("option");
        long.value = "long";
        long.innerHTML = "Long Range";
        if (scores[0][category][1][key][1].length == 4) {
          long.selected = "selceted";
        }
        dropdown.appendChild(long);
        dropdown.addEventListener("change", function () {
          let rangeVals = this.parentElement.getElementsByClassName("rangeval");
          let range = scores[0][category][1][key][1];
          if (this.value == "long") {
            range[0] = Math.min(range[0], range[1]);
            range[1] = Math.max(range[0], range[1]);
            let width = (range[1] - range[0]) / 5;
            range = [range[0] + width, range[0] + 2 * width, range[1] - 2 * width, range[1] - width];
            scores[0][category][1][key][1] = range;
            for (let i = 0; i < 4; i++) {
              rangeVals[i].value = Math.round(range[i] * 100) / 100;
              if (i > 0) {
                rangeVals[i].min = range[i - 1];
              }
              if (i < 3) {
                rangeVals[i].max = range[i + 1];
              }
              rangeVals[i].style.display = "inline";
            }
          } else if (this.value == "short") {
            let width = (range[3] - range[0]) / 3;
            range = [range[0] - width, range[3] + width];
            scores[0][category][1][key][1] = range;
            for (let i = 0; i < 2; i++) {
              rangeVals[i].value = Math.round(range[i] * 100) / 100;
            }
            rangeVals[0].max = range[1];
            rangeVals[1].min = range[0];
            rangeVals[1].max = "";
            for (let i = 2; i < 4; i++) {
              rangeVals[i].style.display = "none";
            }
          }
        });
        datachange.appendChild(dropdown);
        let breakline1 = document.createElement("div");
        breakline1.classList.add("break");
        datachange.appendChild(breakline1);
        for (let i = 0; i < 4; i++) {
          let rangeVal = document.createElement("input");
          rangeVal.type = "number";
          rangeVal.step = "any";
          rangeVal.size = "8";
          rangeVal.classList.add("rangeval");
          if (i < scores[0][category][1][key][1].length) {
            rangeVal.value = scores[0][category][1][key][1][i];
          } else {
            rangeVal.style.display = "none";
          }
          if (i > 0 && i < scores[0][category][1][key][1].length) {
            rangeVal.min = scores[0][category][1][key][1][i - 1];
          }
          if (i < 3 && i < scores[0][category][1][key][1].length - 1) {
            rangeVal.max = scores[0][category][1][key][1][i + 1];
          }
          rangeVal.addEventListener("change", function () {
            if (this.min != "" && this.min != undefined) {
              console.log("min ", this.value);
              this.value = Math.max(this.value, this.min);
            }
            if (this.max != "" && this.max != undefined) {
              console.log("max ", this.value);
              this.value = Math.min(this.value, this.max);
            }
            scores[0][category][1][key][1][i] = parseInt(this.value);
            let rangeVals = this.parentElement.getElementsByClassName("rangeval");
            for (let i = 0; i < 4; i++) {
              if (i > 0 && i < scores[0][category][1][key][1].length) {
                rangeVals[i].min = scores[0][category][1][key][1][i - 1];
              }
              if (i < 3 && i < scores[0][category][1][key][1].length - 1) {
                rangeVals[i].max = scores[0][category][1][key][1][i + 1];
              }
            }
          });
          datachange.appendChild(rangeVal);
        }
        let breakline2 = document.createElement("div");
        breakline2.classList.add("break");
        datachange.appendChild(breakline2);
        for (let i = 0; i < 5; i++) {
          let scoreSlider = document.createElement("input");
          scoreSlider.type = "range";
          scoreSlider.min = "1";
          scoreSlider.max = "5";
          scoreSlider.classList.add("slider");
          scoreSlider.classList.add("vert");
          scoreSlider.value = scoreVals[i];
          scoreSlider.addEventListener("change", function () {
            if (scores[0][category][1][key].length == 2) {
              let defaultScores = [1, 2, 3, 4, 5];
              defaultScores[i] = parseInt(this.value);
              scores[0][category][1][key][2] = defaultScores;
            } else {
              scores[0][category][1][key][2][i] = parseInt(this.value);
              let equals = 1;
              for (let j = 0; j < 5; j++) {
                if ([1, 2, 3, 4, 5][j] != scores[0][category][1][key][2][j]) {
                  equals = 0;
                }
              }
              if (equals) {
                scores[0][category][1][key].pop();
              }
            }
          });
          datachange.appendChild(scoreSlider);
        }
        ///
        document.body.appendChild(datachange);
      });
      document.getElementsByClassName(key)[0].getElementsByClassName("scorecontrol")[0].insertBefore(plus, range);
    }
  }
  setSliders();
});

/*Jaro-Winkler String Similarity Algorithm
Generate a score for the similarity of 2 strings
https://medium.com/@sumn2u/string-similarity-comparision-in-js-with-examples-4bae35f13968*/
function JaroWrinker(s1, s2) {
  let m = 0;
  if (s1.length === 0 || s2.length === 0) {//Exit early if either are empty.
    return 0;
  }
  if (s1 === s2) {//Exit early if they're an exact match.
    return 1;
  }
  let range = (Math.floor(Math.max(s1.length, s2.length) / 2)) - 1, s1Matches = new Array(s1.length), s2Matches = new Array(s2.length);
  for (i = 0; i < s1.length; i++) {
    let low = (i >= range) ? i - range : 0,
      high = (i + range <= s2.length) ? (i + range) : (s2.length - 1);
    for (j = low; j <= high; j++) {
      if (s1Matches[i] !== true && s2Matches[j] !== true && s1[i] === s2[j]) {
        ++m;
        s1Matches[i] = s2Matches[j] = true;
        break;
      }
    }
  }
  if (m === 0) {//Exit early if no matches were found.
    return 0;
  }
  let k = n_trans = 0;//Count the transpositions.
  for (i = 0; i < s1.length; i++) {
    if (s1Matches[i] === true) {
      for (j = k; j < s2.length; j++) {
        if (s2Matches[j] === true) {
          k = j + 1;
          break;
        }
      }
      if (s1[i] !== s2[j]) {
        ++n_trans;
      }
    }
  }
  let weight = (m / s1.length + m / s2.length + (m - (n_trans / 2)) / m) / 3,
    l = 0,
    p = 0.1;
  if (weight > 0.7) {
    while (s1[l] === s2[l] && l < 4) {
      ++l;
    }
    weight = weight + l * p * (1 - weight);
  }
  return weight;
}

let search;
document.getElementById("textinput").addEventListener("click", function () {
  loadFirebaseJSON("/search").then(response => {
    search = response;
    for (let i = 0; i < search.length; i++) {
      for (let j = search[i].length - 1; j > 1; j--) {
        search.push([search[i][0], search[i][j]]);
        search[i].splice(j, 1);
      }
    }
    document.getElementById("textinput").addEventListener("keyup", function (event) {//text box suggestion generator
      if (this.value != "") {
        let suggestions = document.getElementById("suggestions");
        suggestions.innerHTML = "Loading...";
        let results = JSON.parse(JSON.stringify(search));
        for (let i = 0; i < results.length; i++) {
          results[i].push(JaroWrinker(this.value, results[i][1]));
        }
        results.sort(function (a, b) {//Sort results
          if (a[2] > b[2]) {
            return -1;
          } if (a[2] < b[2]) {
            return 1;
          }
          return 0;
        });
        if (event.keyCode === 13) {
          if (document.getElementById(results[0][0]) == null) {
            suggestions.innerHTML = "";
            colleges[results[0][0]] = "";
            addRowToTable(results[0][0]);
          } else {
            window.alert("College already exists.");
          }
        } else {
          suggestions.innerHTML = results.slice(0, 10);
        }
      }
    });
  }, error => {
    console.error("Load Search Data Failed!", error);
  });
}, { once: true });
