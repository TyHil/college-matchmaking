//Donation button configuration
window.DonorBox = { widgetLinkClassName: 'custom-dbox-popup' };
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

function signedIn(loadData) {
  loggedIn = 1;
  window.onbeforeunload = '';
  document.getElementById("login").style.display = "none";
  let img = document.createElement("img");
  img.id = "userimg";
  if (firebase.auth().currentUser.photoURL == null) {
    img = document.createElement("span");
    img.id = "usersvg";
    img.classList.add("icon");
    img.classList.add("material-icons");
    img.innerText = "account_circle";
  } else {
    img.src = firebase.auth().currentUser.photoURL;
  }
  img.addEventListener("click", () => {
    let useractions = document.getElementById("useractions");
    if (useractions.style.display == "flex") {
      useractions.style.display = "none";
    } else {
      useractions.style.display = "flex";
    }
  });
  document.addEventListener('click', function (e) {
    let useractions = document.getElementById("useractions");
    if (!useractions.contains(e.target) && ((document.getElementById("userimg") && !document.getElementById("userimg").contains(e.target)) || (document.getElementById("usersvg") && !document.getElementById("usersvg").contains(e.target)))) {
      useractions.style.display = "none";
    }
  });
  let useractions = document.getElementById("useractions");
  document.getElementById("headerright").appendChild(img);
  useractions.getElementsByTagName("h2")[0].innerText = firebase.auth().currentUser.displayName;
  useractions.getElementsByTagName("h3")[0].innerText = firebase.auth().currentUser.email;
  function reAuth() {
    return new Promise(function (resolve, reject) {
      function finish(credential) {
        firebase.auth().currentUser.reauthenticateWithCredential(credential).then(function() {
          resolve()
        }).catch(function(error) {
          reject(error);
        });
      }
      switch(firebase.auth().currentUser.providerData[0].providerId) {
        case "password":
          let password = prompt("Please enter your password.");
          if (password != null) {
            finish(firebase.auth.EmailAuthProvider.credential(firebase.auth().currentUser.providerData[0].email, password));
          } else {
            reject("No Password");
          }
          break;
        case "google.com":
          var provider = new firebase.auth.GoogleAuthProvider();
          provider.addScope('profile');
          provider.addScope('email');
          firebase.auth().signInWithPopup(provider).then(function(result) {
            finish(result.credential.accessToken);
          }).catch(function(error) {
            reject("Sign In Failed!");
          });
          break;
      }
    });
  }
  document.getElementById("reset").addEventListener("click", function () {
    let confirmmodal = document.getElementById("confirmmodal");
    confirmmodal.getElementsByTagName("h1")[0].innerText = "Confirm Match Score Reset";
    confirmmodal.getElementsByTagName("p")[0].innerText = "This will remove all customization from your match scores and return them to their default state.";
    confirmmodal.style.display = "block";
    document.getElementById("confirm").onclick = function () {
      loadJSON("./UserData/" + scoreNames[0] + ".json").then(response => {
        scores[0] = JSON.parse(response);
        writeUserData(1);
        setSliders();
        for (const college of colleges) {
          updateRowMatchScores(college.ID);
        }
      }, error => {
        createToast("Load " + scoreNames[0] + " Score Failed!");
        console.error("Load " + scoreNames[0] + " Score Failed!", error);
      });
      let content = confirmmodal.getElementsByClassName("content")[0];
      content.classList.add("out");
      confirmmodal.classList.add("out");
      content.addEventListener("animationend", function () {
        confirmmodal.style.display = "none";
        content.classList.remove("out");
        confirmmodal.classList.remove("out");
      }, { once: true });
    };
  });
  document.getElementById("logout").addEventListener("click", function () {
    firebase.auth().signOut().then(() => {
      location.reload();
    }).catch((error) => {
      createToast("Sign Out Failed!");
      console.error("Sign Out Failed!", error);
    });
  });
  document.getElementById("deleteaccnt").addEventListener("click", function () {
    let confirmmodal = document.getElementById("confirmmodal");
    confirmmodal.getElementsByTagName("h1")[0].innerText = "Confirm Delete Account";
    confirmmodal.getElementsByTagName("p")[0].innerText = "This delete your account with College Matchmaking and all of it's associated data.";
    confirmmodal.style.display = "block";
    document.getElementById("confirm").onclick = function () {
      firebase.database().ref('/users/' + firebase.auth().currentUser.uid).remove();
      firebase.auth().currentUser.delete().then(function () {
        location.reload();
      }).catch(function (error) {
        if (error.code == "auth/requires-recent-login") {
          reAuth().then(() => {
            firebase.auth().currentUser.delete().then(function () {
              location.reload();
            }).catch(function (error) {
              createToast("Delete User Failed!");
              console.error("Delete User Failed!", error);
            });
          }, error => {
            createToast("Delete User Failed!");
            console.error("Delete User Failed!", error);
          });
          /*let credential;
          switch(firebase.auth().currentUser.providerData[0].providerId) {
            case "password":
              let password = prompt("Please enter your password.");
              if (password != null) {
                credential = firebase.auth.EmailAuthProvider.credential(firebase.auth().currentUser.providerData[0].email, password);
              }
              break;
            case "google.com":
              credential = firebase.auth.GoogleAuthProvider.credential(googleUser.getAuthResponse().id_token);
          }
          firebase.auth().currentUser.reauthenticateWithCredential(credential).then(function() {
            firebase.auth().currentUser.delete().then(function () {
              location.reload();
            }).catch(function (error) {
              createToast("Delete User Failed!");
              console.error("Delete User Failed!", error);
            });
          }).catch(function(error) {
            createToast("Delete User Failed!");
            console.error("Delete User Failed!", error);
          });*/
        } else {
          createToast("Delete User Failed!");
          console.error("Delete User Failed!", error);
        }
      });
    };
  });
  if (firebase.auth().currentUser.providerData[0].providerId == "password") {
    document.getElementById("changeemail").addEventListener("click", function () {
      let email = prompt("Please enter your new email.");
      if (email != null) {
        firebase.auth().currentUser.updateEmail(email).then(function() {
          createToast("Email Changed!");
        }).catch(function(error) {
          if (error.code == "auth/requires-recent-login") {
            reAuth().then(() => {
              firebase.auth().currentUser.updateEmail(email).then(function() {
                createToast("Email Changed!");
              }).catch(function(error) {
                createToast("Change Email Failed!");
                console.error("Change Email Failed!", error);
              });
            }, error => {
              createToast("Change Email Failed!");
              console.error("Change Email Failed!", error);
            });
          } else {
            createToast("Change Email Failed!");
            console.error("Change Email Failed!", error);
          }
        });
      } else {
        createToast("Invalid Email!");
      }
    });
    document.getElementById("changepass").addEventListener("click", function () {
      let pass = prompt("Please enter your new password.");
      if (pass != null) {
        firebase.auth().currentUser.updatePassword(pass).then(function() {
          createToast("Password Changed!");
        }).catch(function(error) {
          if (error.code == "auth/requires-recent-login") {
            reAuth().then(() => {
              firebase.auth().currentUser.updatePassword(pass).then(function() {
                createToast("Password Changed!");
              }).catch(function(error) {
                createToast("Change Password Failed!");
                console.error("Change Password Failed!", error);
              });
            }, error => {
              createToast("Change Password Failed!");
              console.error("Change Password Failed!", error);
            });
          } else {
            createToast("Change Password Failed!");
            console.error("Change Password Failed!", error);
          }
        });
      } else {
        createToast("Invalid Password!");
      }
    });
  } else {
    document.getElementById("changeemail").style.display = "none";
    document.getElementById("changepass").style.display = "none";
  }
  if (loadData) {
    let scoresLoaded = loadFirebaseJSON("/users/" + firebase.auth().currentUser.uid).then(response => {
      for (const college of colleges) {
        document.getElementById(college.ID).remove();
      }
      colleges = response.colleges;
      collegesData = {};
      for (const college of colleges) {
        addRowToTable(college.ID);
      }
      scores[0] = response[scoreNames[0]];
      setSliders();
      userinfo = response.userinfo;
      document.getElementById("testscore").getElementsByTagName("select")[0].value = userinfo.test;
      let input = document.getElementById("testscore").getElementsByTagName("input")[0];
      if (userinfo.test == "none") {
        input.style.display = "none";
      } else if (userinfo.test == "act") {
        input.style.display = "inline-block";
        input.min = 1;
        input.max = 36;
        input.step = 1;
        input.value = userinfo[userinfo.test];
      } else if (userinfo.test == "sat") {
        input.style.display = "inline-block";
        input.min = 400;
        input.max = 1600;
        input.step = 10;
        input.value = userinfo[userinfo.test];
      }
      document.getElementById("gpa").getElementsByTagName("input")[0].value = userinfo.gpa;
      document.getElementById("needaid").getElementsByTagName("input")[0].checked = userinfo.needaid;
      document.getElementById("income").getElementsByTagName("select")[0].value = userinfo.income;
    }, error => {
      createToast("Load User Data Failed!");
      console.error("Load User Data Failed!", error);
    });
    allLoaded.push(scoresLoaded);
  } else {
    writeUserData(1);
  }
}

let uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function (authResult) {//User successfully signed in
      document.getElementById("loginmodal").style.display = "none";
      if (authResult.additionaluseractions.isNewUser) {
        writeUserData(1);
      }
      signedIn(!authResult.additionaluseractions.isNewUser);
    },
    uiShown: function () {//The widget is rendered
      document.getElementById("loginmodal").getElementsByTagName("h1")[0].innerText = "Sign In or Sign Up";
    }
  },
  signInFlow: 'popup',
  signInOptions: [
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
    firebase.auth.GoogleAuthProvider.PROVIDER_ID
  ],
  /// Terms of service url.
  tosUrl: '<your-tos-url>',
  /// Privacy policy url.
  privacyPolicyUrl: '<your-privacy-policy-url>'
};

function createToast(text, callback = 0) {
  let div = document.createElement("div");
  div.classList.add("toast");
  let p = document.createElement("p");
  p.innerText = text;
  div.appendChild(p);
  if (callback) {
    let undo = document.createElement("a");
    undo.innerText = "Undo";
    undo.addEventListener("click", function() {
      callback();
      div.classList.add("animateout");
      div.addEventListener("animationend", function () {
        div.remove();
      });
    });
    div.appendChild(undo);
  }
  let clearTimer = setTimeout(function () {
    div.classList.add("animateout");
    div.addEventListener("animationend", function () {
      div.remove();
    });
  }, 6000);
  div.addEventListener("mouseover", function() {
    clearTimeout(clearTimer);
  });
  div.addEventListener("mouseout", function() {
    clearTimer = setTimeout(function () {
      div.classList.add("animateout");
      div.addEventListener("animationend", function () {
        div.remove();
      });
    }, 6000);
  });
  document.getElementById("toasts").appendChild(div);
  div.classList.add("animatein");
}

function writeUserData(toast) {
  if (loggedIn) {
    firebase.database().ref('/users/' + firebase.auth().currentUser.uid).set({
      colleges: colleges,
      FLOAT: scores[0],
      userinfo: userinfo
    }).then(() => {
      if (toast) {
        createToast("Saved!");
      }
      window.onbeforeunload = '';
    }).catch((error) => {
      window.onbeforeunload = () => '';
      createToast("Save Data Failed!");
      console.error("Save Data Failed!", error);
    });
  } else {
    window.onbeforeunload = () => '';
  }
}

document.getElementById("login").addEventListener("click", event => {
  if (!ui.isPendingRedirect()) {
    document.getElementById("loginmodal").style.display = "block";
    ui.start('#firebaseui-auth-container', uiConfig);
  }
});
document.querySelectorAll(".close").forEach(item => {
  item.addEventListener('click', event => {
    let content = item.parentElement;
    let modal = content.parentElement;
    content.classList.add("out");
    modal.classList.add("out");
    content.addEventListener("animationend", function() {
      modal.style.display = "none";
      content.classList.remove("out");
      modal.classList.remove("out");
    }, {once: true});
  });
});
document.addEventListener('click', function (e) {
  for (const modal of document.getElementsByClassName("modal")) {
    if (modal.contains(e.target) && !modal.childNodes[1].contains(e.target)) {
      let content = modal.getElementsByClassName("content")[0];
      content.classList.add("out");
      modal.classList.add("out");
      content.addEventListener("animationend", function () {
        modal.style.display = "none";
        content.classList.remove("out");
        modal.classList.remove("out");
      }, { once: true });
    }
  }
  let datachanges = document.getElementsByClassName("datachange");
  let datachangeDisplay = 0;
  for (const datachange of datachanges) {
    if (datachange.style.display != "none") {
      datachangeDisplay = 1;
    }
  }
  if (datachangeDisplay) {
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
      writeUserData(1);
      for (const datachange of datachanges) {
        datachange.style.display = "none";
      }
      for (const college of colleges) {
        updateRowMatchScores(college.ID);
      }
    }
  }
  let suggestions = document.getElementById("suggestions");
  if (!document.getElementById("textinput").contains(e.target) && !suggestions.contains(e.target)) {
    suggestions.style.display = "none";
  }
});
document.getElementById("cancel").addEventListener("click", function () {
  let content = this.parentElement.parentElement;
  let modal = content.parentElement;
  content.classList.add("out");
  modal.classList.add("out");
  content.addEventListener("animationend", function() {
    modal.style.display = "none";
    content.classList.remove("out");
    modal.classList.remove("out");
  }, {once: true});
});
document.addEventListener("keydown", (e) => {
  if (e.keyCode == 27) {//ESC
    for (const modal of document.getElementsByClassName("modal")) {
      let content = modal.getElementsByClassName("content")[0];
      content.classList.add("out");
      modal.classList.add("out");
      content.addEventListener("animationend", function () {
        modal.style.display = "none";
        content.classList.remove("out");
        modal.classList.remove("out");
      }, { once: true });
    }
    for (const popup of document.getElementsByClassName("popup")) {
      popup.style.display = "none";
    }
  }
});

let userinfo = { "test": "sat", "sat": 1200, "gpa": 3.0, "needaid": 1, "income": "none" };
document.getElementById("testscore").getElementsByTagName("select")[0].addEventListener("change", function () {
  let input = this.parentElement.getElementsByTagName("input")[0];
  if (this.value == "none") {
    input.style.display = "none";
    userinfo.test = "none";
    delete userinfo.sat;
    delete userinfo.act;
    writeUserData(1);
  } else if (this.value == "act") {
    input.style.display = "inline-block";
    input.min = 1;
    input.max = 36;
    input.step = 1;
    if (input.value >= 400) {
      input.value = Math.round((35 / 1200) * (input.value - 400) + 1);
    }
    userinfo.test = "act";
    delete userinfo.sat;
    userinfo.act = parseInt(input.value);
    writeUserData(1);
  } else if (this.value == "sat") {
    input.style.display = "inline-block";
    input.min = 400;
    input.max = 1600;
    input.step = 10;
    if (input.value < 400) {
      input.value = Math.round(((1200 / 35) * (input.value - 1) + 400) / 10) * 10;
    }
    userinfo.test = "sat";
    delete userinfo.act;
    userinfo.sat = parseInt(input.value);
    writeUserData(1);
  }
});
document.getElementById("testscore").getElementsByTagName("input")[0].addEventListener("change", function () {
  this.value = Math.max(Math.min(this.value, this.max), this.min);
  userinfo[this.parentElement.getElementsByTagName("select")[0].value] = parseInt(this.value);
  writeUserData(1);
});
document.getElementById("gpa").getElementsByTagName("input")[0].addEventListener("change", function () {
  this.value = Math.max(Math.min(this.value, this.max), this.min);
  userinfo.gpa = parseFloat(this.value);
  writeUserData(1);
});
document.getElementById("needaid").getElementsByTagName("input")[0].addEventListener("click", function () {
  userinfo.needaid = this.checked ? 1 : 0;
  writeUserData(1);
});
document.getElementById("income").getElementsByTagName("select")[0].addEventListener("change", function () {
  userinfo.income = this.value;
  writeUserData(1);
});

let loggedIn = 0;
let unsubscribe = firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    signedIn(1);
    unsubscribe();
  } else {
    let genericmodal = document.getElementById("genericmodal");
    genericmodal.style.display = "block";
    genericmodal.getElementsByTagName("h1")[0].innerText = "Welcome";
    genericmodal.getElementsByTagName("p")[0].innerText = "Put a bunch of intro material here";
  }
});

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

let scoreModalInfo = ["Without considering likelihood of getting accepted, does this college have the things you are looking for? The FLOAT score is great to use when you do not yet know your test scores, you are just getting started looking at colleges, or you do not feel like facing reality yet. Think about your FLOAT score as an low-stress way to start browsing for colleges. It calculates match without considering anything on the Acceptance tab. No need to enter your test scores or GPA.", "Imagine that a college matches your needs and is easy to get into. Smooth sailing for you! The SAIL score considers overall match (the same things considered as part of your FLOAT score), but it also takes into account the likelihood of you getting accepted. For schools with similar FLOAT scores, you will see higher SAIL scores the easier it will be for you to get accepted. The SAIL score also assumes that you will not mind sailing past your peers as an above average student at your new college.  This score might also reflect a better chance at merit-based aid and/or admission into honors programs.", "The SWIM score considers overall match and likelihood of getting accepted but assumes that may not want to be the smartest kid in class. You want to be inspired by your brilliant peers. You are not afraid of a sink-or-swim mentality at a challenging college. Your SWIM score will bump up your FLOAT score at schools where you match the average profile. It lowers for schools where you would be significantly above or below average, based on your academic record and scores."];
let headers;
let headersLoaded = loadJSON("./headers.json").then(response => {//load headers for table from headers.json
  headers = JSON.parse(response);
  let table = document.getElementById("table");
  let categorytr = document.createElement("tr");
  let datatr = document.createElement("tr");
  for (const category in headers) {
    if (category != "Actions" && category != "Info") {
      let button = document.createElement("a");
      button.classList.add("hidebutton");
      button.classList.add("clicked");
      button.id = category.replace(/\s+/g, '');
      button.innerText = category;
      button.addEventListener("click", function () {
        let cats = document.getElementsByClassName(category.replace(/\s+/g, ''));
        if (cats[0].style.display == "none") {
          button.classList.add("clicked");
          for (const cat of cats) {
            cat.style.display = "table-cell";
          }
        } else {
          button.classList.remove("clicked");
          for (const cat of cats) {
            cat.style.display = "none";
          }
        }
      });
      document.body.insertBefore(button, document.getElementById("addcollege"));
    }
    let categoryth = document.createElement("th");
    let h2 = document.createElement("h2");
    h2.innerText = category;
    categoryth.appendChild(h2);
    if (Array.isArray(headers[category])) {
      categoryth.rowSpan = 2;
    } else {
      let length = 0;
      for (const key in headers[category]) {
        let datath = document.createElement("th");
        for (let i = 0; i < 3; i++) {
          if (key == scoreNames[i]) {
            let img = document.createElement("img");
            img.src = "icons/" + scoreNames[i] + ".svg";
            img.classList.add("scoreicon");
            img.addEventListener("click", function () {
              let genericmodal = document.getElementById("genericmodal");
              genericmodal.style.display = "block";
              genericmodal.getElementsByTagName("h1")[0].innerText = scoreNames[i] + " Score";
              genericmodal.getElementsByTagName("p")[0].innerText = scoreModalInfo[i];
            });
            datath.appendChild(img);
          }
        }
        let h3 = document.createElement("h3");
        h3.innerText = key;
        datath.appendChild(h3);
        datath.classList.add(category.replace(/\s+/g, ''));
        datath.classList.add(headers[category][key][0]);
        datatr.appendChild(datath);
        length++;
      }
      categoryth.colSpan = length;
    }
    categoryth.classList.add(category.replace(/\s+/g, ''));
    categorytr.appendChild(categoryth);
  }
  table.appendChild(categorytr);
  table.appendChild(datatr);
}, error => {
  createToast("Load Headers Failed!");
  console.error("Load Headers Failed!", error);
});
allLoaded.push(headersLoaded);

let scores = [];//scores float, sail, and swim scores.
let scoreNames = ["FLOAT", "SAIL", "SWIM"];

for (let i = 0; i < 3; i++) {//load all scores
  let scoreLoaded = loadJSON(((i == 0) ? "UserData/" : "") + scoreNames[i] + ".json").then(response => {
    scores[i] = JSON.parse(response);
  }, error => {
    createToast("Load " + scoreNames[i] + " Score Failed!");
    console.error("Load " + scoreNames[i] + " Score Failed!", error);
  });
  allLoaded.push(scoreLoaded);
}

function getFromColleges(college) {
  for (const coll of colleges) {
    if (coll.ID == college) {
      return coll;
    }
  }
}

let colleges;//users list of colleges
let collegesData = {};//locally stored college data
let collegesLoaded = loadJSON("./UserData/colleges.json").then(response => {
  colleges = JSON.parse(response);
}, error => {
  createToast("Load College List Failed!");
  console.error("Load College List Failed!", error);
});
allLoaded.push(collegesLoaded);

function updateRowMatchScores(college) {
  let floatScore;
  for (let i = 0; i < 3; i++) {//update match scores
    let scoreTot = 0;
    let weightSumTot = 0;
    for (const category in scores[i]) {
      let scoreCat = 0;
      let weightSumCat = 0;
      if (category in getFromColleges(college)) {
        scoreCat = getFromColleges(college)[category];
        weightSumCat = 5;
      } else {
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
              document.getElementById(college).getElementsByClassName(key)[0].style.backgroundColor = "var(--high" + (scoreDat - 1) +")";//cell highlights
            }
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
    document.getElementById(college).getElementsByClassName(scoreNames[i])[0].innerText = Math.round(score * 10000) / 100 + "%";
    document.getElementById(college).getElementsByClassName(scoreNames[i])[0].style.backgroundColor = "var(--high" + (Math.trunc(score * 5)) + ")";//score highlight
  }
}

function updateRowData(college) {
  loadFirebaseJSON("/colleges/" + college).then(response => {
    collegesData[college] = response;
    for (const category in headers) {//update data in table
      if (category == "Notes") {
        document.getElementById(college).getElementsByClassName("Notes")[0].getElementsByTagName("textarea")[0].value = getFromColleges(college).Notes;
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
          document.getElementById(college).getElementsByClassName(headers[category][key][0])[0].innerText = fill;
        }
      }
    }
    updateRowMatchScores(college);
  }, error => {
    createToast("Load " + college + " Data Failed!");
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
      let actionsdiv = document.createElement("div");
      actionsdiv.classList.add("actionsdiv");
      let arrowdiv = document.createElement("div");
      arrowdiv.classList.add("arrowdiv");
      let up = document.createElement("span");
      up.classList.add("icon");
      up.classList.add("arrow");
      up.classList.add("material-icons");
      up.innerText = "expand_less";
      up.addEventListener("click", () => {
        for (let i = 1; i < colleges.length; i++) {
          if (colleges[i].ID == college) {
            document.getElementById("table").insertBefore(document.getElementById(colleges[i].ID), document.getElementById(colleges[i - 1].ID));
            let temp = colleges[i - 1];
            colleges[i - 1] = colleges[i];
            colleges[i] = temp;
            writeUserData(1);
            break;
          }
        }
      });
      arrowdiv.appendChild(up);
      let down = document.createElement("span");
      down.classList.add("icon");
      down.classList.add("arrow");
      down.classList.add("material-icons");
      down.innerText = "expand_more";
      down.addEventListener("click", () => {
        for (let i = 0; i < colleges.length - 1; i++) {
          if (colleges[i].ID == college) {
            document.getElementById("table").insertBefore(document.getElementById(colleges[i + 1].ID), document.getElementById(colleges[i].ID));
            let temp = colleges[i];
            colleges[i] = colleges[i + 1];
            colleges[i + 1] = temp;
            writeUserData(1);
            break;
          }
        }
      });
      arrowdiv.appendChild(down);
      actionsdiv.appendChild(arrowdiv);
      let remove = document.createElement("span");
      remove.classList.add("icon");
      remove.classList.add("material-icons");
      remove.classList.add("removeicon");
      remove.innerText = "delete";
      remove.addEventListener("click", () => {
        document.getElementById(college).remove();
        createToast(collegesData[getFromColleges(college).ID].Name + " Removed", function () {
          colleges.push({ "ID": college, "Notes": "" });
          addRowToTable(college);
          writeUserData(1);
        });
        for (let i = 0; i < colleges.length; i++) {
          if (colleges[i].ID == college) {
            colleges.splice(i, 1);
          }
        }
        writeUserData(0);
      });
      actionsdiv.appendChild(remove);
      td.appendChild(actionsdiv);
      tr.appendChild(td);
    } else if (category == "Notes") {
      let td = document.createElement("td");
      td.classList.add(category);
      let textarea = document.createElement("textarea");
      textarea.maxlength = "10";
      textarea.addEventListener("blur", function () {
        getFromColleges(college).Notes = this.value;
        writeUserData(1);
      });
      td.appendChild(textarea);
      let button = document.getElementById(category.replace(/\s+/g, ''));
      if (button != null && !button.classList.contains("clicked")) {
        td.style.display = "none";
      }
      tr.appendChild(td);
    } else {
      let colorBool = 0;
      if (category in scores[0]) {
        let overridetd = document.createElement("td");
        overridetd.classList.add(category.replace(/\s+/g, ''));
        overridetd.classList.add("override");
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = (category in getFromColleges(college));
        let score = document.createElement("p");
        score.classList.add("overridelabel");
        let scoreSlider = document.createElement("input");
        scoreSlider.type = "range";
        scoreSlider.min = "1";
        scoreSlider.max = "5";
        scoreSlider.classList.add("slider");
        scoreSlider.classList.add("over");
        if (category in getFromColleges(college)) {
          score.innerText = getFromColleges(college)[category];
          scoreSlider.value = getFromColleges(college)[category];
          overridetd.style.backgroundColor = "var(--high" + (getFromColleges(college)[category] - 1) + ")";
          colorBool = 1;
        } else {
          scoreSlider.style.display = "none";
          score.style.display = "none";
        }
        checkbox.addEventListener("click", function () {
          if (this.checked) {
            scoreSlider.style.display = "block";
            score.style.display = "block";
            score.innerText = 3;
            scoreSlider.value = 3;
            getFromColleges(college)[category] = 3;
            writeUserData(1);
            overridetd.style.backgroundColor = "var(--high2)";
            for (const key in scores[0][category][1]) {
              tr.getElementsByClassName(key)[0].style.backgroundColor = "var(--high2)";
            }
            updateRowMatchScores(college);
          } else {
            scoreSlider.style.display = "none";
            score.style.display = "none";
            delete getFromColleges(college)[category];
            writeUserData(1);
            overridetd.style.backgroundColor = "var(--light0)";
            updateRowMatchScores(college);
          }
        });
        overridetd.appendChild(checkbox);
        overridetd.appendChild(score);
        scoreSlider.addEventListener("input", function () {
          score.innerText = this.value;
          overridetd.style.backgroundColor = "var(--high" + (this.value - 1) + ")";
          for (const key in scores[0][category][1]) {
            tr.getElementsByClassName(key)[0].style.backgroundColor = "var(--high" + (this.value - 1) + ")";
          }
        });
        scoreSlider.addEventListener("change", function () {
          getFromColleges(college)[category] = parseInt(this.value);
          writeUserData(1);
          updateRowMatchScores(college);
        });
        overridetd.appendChild(scoreSlider);
        let button = document.getElementById(category.replace(/\s+/g, ''));
        if (button != null && !button.classList.contains("clicked")) {
          overridetd.style.display = "none";
        }
        tr.appendChild(overridetd);
      }
      for (const key in headers[category]) {
        let td = document.createElement("td");
        td.classList.add(category.replace(/\s+/g, ''));
        td.classList.add(headers[category][key][0]);
        if (colorBool && headers[category][key][0] in scores[0][category][1]) {
          td.style.backgroundColor = "var(--high" + (getFromColleges(college)[category] - 1) + ")";
        }
        let button = document.getElementById(category.replace(/\s+/g, ''));
        if (button != null && !button.classList.contains("clicked")) {
          td.style.display = "none";
        }

        tr.appendChild(td);
      }
    }
  }
  document.getElementById("table").appendChild(tr);
  updateRowData(college);
}

function setSliders() {
  for (const category in scores[0]) {
    let cell = document.getElementsByClassName(category.replace(/\s+/g, ''))[0];
    cell.getElementsByClassName("slider")[0].value = scores[0][category][0];
    cell.getElementsByClassName("weight")[0].innerText = "Weight: " + scores[0][category][0];
    for (const key in scores[0][category][1]) {
      let cell = document.getElementsByClassName(key)[0];
      cell.getElementsByClassName("slider")[0].value = scores[0][category][1][key][0];
      cell.getElementsByClassName("weight")[0].innerText = "Weight: " + scores[0][category][1][key][0];
    }
  }
}

function createSlider(nameClass, val) {
  let div = document.createElement("div");
  div.classList.add("scorecontrol");
  let weight = document.createElement("p");
  weight.classList.add("weight");
  weight.innerText = "Weight: " + val;
  div.appendChild(weight);
  let range = document.createElement("input");
  range.type = "range";
  range.min = "0";
  range.max = "5";
  range.value = val;
  range.classList.add("slider");
  range.addEventListener("input", function () {
    this.parentElement.getElementsByTagName("p")[0].innerText = "Weight: " + this.value;
  });
  div.appendChild(range);
  div.style.width = "100px";
  document.getElementsByClassName(nameClass)[0].appendChild(div);
  return range;
}

function datachangePos(datachange, plus) {
  datachange.style.left = plus.parentElement.getBoundingClientRect().x + (window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0) + "px";
}

let datachangePlusPairs = [];

document.getElementById("tableholder").addEventListener("scroll", function () {
  datachangePlusPairs.forEach(function (item) {
    if (item[0].style.display != "none") {
      datachangePos(item[0], item[1]);
    }
  });
});

Promise.all(allLoaded).then(function () {//when headers, scores, and colleges are loaded
  /*Load Overrides*/
  for (const category in headers) {
    if (category in scores[0]) {
      let rows = document.getElementById("table").getElementsByTagName("tr");
      rows[0].getElementsByClassName(category)[0].colSpan++;
      let overrideth = document.createElement("th");
      let h3 = document.createElement("h3");
      h3.innerText = "Override";
      overrideth.appendChild(h3);
      overrideth.classList.add(category.replace(/\s+/g, ''));
      overrideth.classList.add("override");
      rows[1].insertBefore(overrideth, rows[1].getElementsByClassName(category)[0]);
    }
  }
  for (const college of colleges) {
    addRowToTable(college.ID);
  }
  for (const category in scores[0]) {
    createSlider(category, scores[0][category][0]).addEventListener("change", function () {
      scores[0][category][0] = parseInt(this.value);
      for (const college of colleges) {
        updateRowMatchScores(college.ID);
      }
      writeUserData(1);
    });
    for (const key in scores[0][category][1]) {
      let range = createSlider(key, scores[0][category][1][key][0]);
      range.addEventListener("change", function () {
        scores[0][category][1][key][0] = parseInt(this.value);
        for (const college of colleges) {
          updateRowMatchScores(college.ID);
        }
        writeUserData(1);
      });
      let plus = document.createElement("span");
      let datachange = document.createElement("div");
      datachange.style.display = "none";
      datachangePlusPairs.push([datachange, plus]);
      plus.classList.add("plus");
      plus.classList.add("icon");
      plus.classList.add("material-icons");
      plus.innerText = "expand_more";      document.getElementsByClassName(key)[0].getElementsByClassName("scorecontrol")[0].insertBefore(plus, range);
      let scoreVals = [1, 2, 3, 4, 5];
      if (scores[0][category][1][key].length == 3) {//custom score ordering defined
        scoreVals = scores[0][category][1][key][2];
      }
      datachange.classList.add("popup");
      datachange.classList.add("datachange");
      let h2 = document.createElement("h2");
      h2.innerText = "Change Range";
      datachange.appendChild(h2);
      let h3 = document.createElement("h3");
      h3.innerText = "Redefine what makes a good score.";
      datachange.appendChild(h3);
      let barbox = document.createElement("div");
      barbox.classList.add("barbox");
      for (let i = 0; i < 5; i++) {
        let bar = document.createElement("bar");
        bar.classList.add("bar");
        bar.style.backgroundColor = "var(--high" + (scoreVals[i] - 1) + ")";
        if (i > 0 && i < 4) {
          let range = scores[0][category][1][key][1];
          if (range.length == 2) {//min and max defined
            let width = (range[1] - range[0]) / 5;
            range = [range[0] + width, range[0] + 2 * width, range[1] - 2 * width, range[1] - width];
          }
          bar.style.width = (200 - 2 * 10 - 2 * 20) * ((range[i] - range[i - 1]) / (range[3] - range[0])) + "px";
        }
        barbox.appendChild(bar);
      }
      datachange.appendChild(barbox);
      let breakline1 = document.createElement("div");
      breakline1.classList.add("break");
      datachange.appendChild(breakline1);
      let reset = document.createElement("a");
      reset.classList.add("mainbtn");
      reset.innerText = "Reset";
      reset.addEventListener("click", function () {
        loadJSON("UserData/" + scoreNames[0] + ".json").then(response => {
          scores[0][category][1][key] = JSON.parse(response)[category][1][key];
          writeUserData(1);
          datachange.style.display = "none";
          setSliders();
        }, error => {
          createToast("Load " + scoreNames[0] + " Score Failed!");
          console.error("Load " + scoreNames[0] + " Score Failed!", error);
        });
      });
      datachange.appendChild(reset);
      let dropdown = document.createElement("select");
      dropdown.classList.add("dropdown");
      let short = document.createElement("option");
      short.value = "short";
      short.innerText = "Short Range";
      dropdown.appendChild(short);
      let long = document.createElement("option");
      long.value = "long";
      long.innerText = "Long Range";
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
      let breakline2 = document.createElement("div");
      breakline2.classList.add("break");
      datachange.appendChild(breakline2);
      let isPercent = (headers[category][Object.keys(headers[category]).find(keyh => headers[category][keyh][0] == key)][1] == "%");
      for (let i = 0; i < 4; i++) {
        let rangeVal = document.createElement("input");
        rangeVal.type = "number";
        rangeVal.step = "any";
        rangeVal.size = "8";
        rangeVal.classList.add("rangeval");
        rangeVal.addEventListener("input", function () {
          if ((this.hasAttribute("min") && parseInt(this.value) < parseInt(this.min)) || (this.hasAttribute("max") && parseInt(this.value) > parseInt(this.max))) {
            this.style.backgroundColor = "var(--high0)";
          } else {
            this.style.backgroundColor = "var(--light2)";
            let bars = this.parentElement.getElementsByClassName("bar");
            for (let j = 0; j < 5; j++) {
              if (j > 0 && j < 4) {
                let range = scores[0][category][1][key][1];
                range[i] = parseInt(this.value);
                if (isPercent) {
                  range[i] /= 100;
                }
                if (range.length == 2) {//min and max defined
                  let width = (range[1] - range[0]) / 5;
                  range = [range[0] + width, range[0] + 2 * width, range[1] - 2 * width, range[1] - width];
                }
                bars[j].style.width = (200 - 2 * 10 - 2 * 20) * ((range[j] - range[j - 1]) / (range[3] - range[0])) + "px";
              }
            }
          }
        });
        rangeVal.addEventListener("change", function () {
          if (this.hasAttribute("min")) {
            this.value = Math.max(this.value, this.min);
          }
          if (this.hasAttribute("max")) {
            this.value = Math.min(this.value, this.max);
          }
          this.style.backgroundColor = "var(--light2)";
          scores[0][category][1][key][1][i] = parseInt(this.value);
          if (isPercent) {
            scores[0][category][1][key][1][i] /= 100;
          }
          let rangeVals = this.parentElement.getElementsByClassName("rangeval");
          for (let i = 0; i < 4; i++) {
            if (i > 0 && i < scores[0][category][1][key][1].length) {
              rangeVals[i].min = scores[0][category][1][key][1][i - 1];
              if (isPercent) {
                rangeVals[i].min *= 100;
              }
            }
            if (i < 3 && i < scores[0][category][1][key][1].length - 1) {
              rangeVals[i].max = scores[0][category][1][key][1][i + 1];
              if (isPercent) {
                rangeVals[i].max *= 100;
              }
            }
          }
        });
        datachange.appendChild(rangeVal);
      }
      let breakline3 = document.createElement("div");
      breakline3.classList.add("break");
      datachange.appendChild(breakline3);
      for (let i = 0; i < 5; i++) {
        let div = document.createElement("div");
        let score = document.createElement("p");
        score.classList.add("scorelabel");
        score.innerText = scoreVals[i];
        div.appendChild(score);
        let scoreSlider = document.createElement("input");
        scoreSlider.type = "range";
        scoreSlider.min = "1";
        scoreSlider.max = "5";
        scoreSlider.classList.add("slider");
        scoreSlider.classList.add("vert");
        scoreSlider.value = scoreVals[i];
        scoreSlider.addEventListener("input", function () {
          score.innerText = this.value;
          this.parentElement.parentElement.getElementsByClassName("bar")[i].style.backgroundColor = "var(--high" + (this.value - 1) + ")";
        });
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
        div.appendChild(scoreSlider);
        datachange.appendChild(div);
      }
      document.body.appendChild(datachange);
      plus.addEventListener("click", function () {
        if (datachange.style.display == "none") {
          let scoreVals2 = [1, 2, 3, 4, 5];
          if (scores[0][category][1][key].length == 3) {//custom score ordering defined
            scoreVals2 = scores[0][category][1][key][2];
          }
          datachange.style.top = plus.getBoundingClientRect().y + 16 + 26 + (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0) + "px";
          datachangePos(datachange, plus);
          let bars = datachange.getElementsByClassName("bar");
          for (let i = 0; i < 5; i++) {
            bars[i].style.backgroundColor = "var(--high" + (scoreVals2[i] - 1) + ")";
            if (i > 0 && i < 4) {
              let range = scores[0][category][1][key][1];
              if (range.length == 2) {//min and max defined
                let width = (range[1] - range[0]) / 5;
                range = [range[0] + width, range[0] + 2 * width, range[1] - 2 * width, range[1] - width];
              }
              bars[i].style.width = (200 - 2 * 10 - 2 * 20) * ((range[i] - range[i - 1]) / (range[3] - range[0])) + "px";
            }
          }
          if (scores[0][category][1][key][1].length == 2) {
            short.selected = "selected";
          }
          if (scores[0][category][1][key][1].length == 4) {
            long.selected = "selected";
          }
          let rangeVals = datachange.getElementsByClassName("rangeval");
          for (let i = 0; i < 4; i++) {
            if (i < scores[0][category][1][key][1].length) {
              rangeVals[i].value = scores[0][category][1][key][1][i];
              if (isPercent) {
                rangeVals[i].value *= 100;
              }
            } else {
              rangeVals[i].style.display = "none";
            }
            if (i > 0 && i < scores[0][category][1][key][1].length) {
              rangeVals[i].min = scores[0][category][1][key][1][i - 1];
              if (isPercent) {
                rangeVals[i].min *= 100;
              }
            }
            if (i < 3 && i < scores[0][category][1][key][1].length - 1) {
              rangeVals[i].max = scores[0][category][1][key][1][i + 1];
              if (isPercent) {
                rangeVals[i].max *= 100;
              }
            }
          }
          let scoreSliders = datachange.getElementsByClassName("vert");
          let scoreLabels = datachange.getElementsByClassName("scorelabel");
          for (let i = 0; i < 5; i++) {
            scoreSliders[i].value = scoreVals2[i];
            scoreLabels[i].innerText = scoreVals2[i];
          }
          document.body.appendChild(datachange);//move to front
          datachange.style.display = "flex";
        } else {
          writeUserData(1);
          datachange.style.display = "none";
        }
      });
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
  for (let i = 0; i < s1.length; i++) {
    let low = (i >= range) ? i - range : 0,
      high = (i + range <= s2.length) ? (i + range) : (s2.length - 1);
    for (let j = low; j <= high; j++) {
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
  let k = 0;//Count the transpositions.
  let n_trans = 0;
  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i] === true) {
      let j;
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

let search = [];
document.getElementById("textinput").addEventListener("click", function () {
  loadFirebaseJSON("/search").then(response => {
    for (const key in response) {
      if (Array.isArray(response[key])) {
        for (let i = 0; i < response[key].length; i++) {//(const alias of response[key]) {
          let arr = [key, response[key][i]];
          if (i != 0) {
            arr.push(response[key][0]);
          }
          search.push(arr);
        }
      } else {
        search.push([key, response[key]]);
      }
    }
    let suggestions = document.getElementById("suggestions");
    let currentFocus;
    for (let i = 0; i < 10; i++) {
      let div = document.createElement("div");
      div.appendChild(document.createElement("p"));
      let input = document.createElement("input");
      input.type = "hidden";
      div.appendChild(input);
      suggestions.appendChild(div);
      div.addEventListener("click", function () {
        let itemVal = this.getElementsByTagName("input")[0].value;
        colleges.push({ "ID": itemVal, "Notes": "" });
        addRowToTable(itemVal);
        writeUserData(1);
        suggestions.style.display = "none";
        currentFocus = -1;
        let removeActive = suggestions.getElementsByClassName("active")[0];
        if (removeActive != undefined) {
          removeActive.classList.remove("active");
        }
      });
    }
    document.getElementById("textinput").addEventListener("input", function (event) {//text box suggestion generator
      if (this.value != "") {
        suggestions.style.display = "block";
        let results = JSON.parse(JSON.stringify(search));
        for (let i = 0; i < results.length; i++) {
          results[i].push(JaroWrinker(this.value, results[i][1]));
        }
        results.sort(function (a, b) {//Sort results
          if (a[a.length - 1] > b[b.length - 1]) {
            return -1;
          } if (a[a.length - 1] < b[b.length - 1]) {
            return 1;
          }
          return 0;
        });
        currentFocus = -1;
        let removeActive = suggestions.getElementsByClassName("active")[0];
        if (removeActive != undefined) {
          removeActive.classList.remove("active");
        }
        let items = suggestions.getElementsByTagName("div");
        for (let i = 0; i < 10; i++) {
          items[i].getElementsByTagName("p")[0].innerText = results[i][results[i].length - 2];
          items[i].getElementsByTagName("input")[0].value = results[i][0];
        }
      }
    });
    this.addEventListener("keydown", function (e) {
      let items = document.getElementById("suggestions").getElementsByTagName("div");
      if (e.keyCode == 40) {//Down
        currentFocus = (currentFocus + 1) % 10;
      } else if (e.keyCode == 38) {//Up
        currentFocus = (currentFocus + 10 - 1) % 10;
      }
      if (e.keyCode == 40 || e.keyCode == 38) {
        let removeActive = suggestions.getElementsByClassName("active")[0];
        if (removeActive != undefined) {
          removeActive.classList.remove("active");
        }
        items[currentFocus].classList.add("active");
      } else if (event.keyCode === 13 && currentFocus != -1) {
        let itemVal = suggestions.getElementsByTagName("div")[currentFocus].getElementsByTagName("input")[0].value;
        if (document.getElementById(itemVal) == null) {
          colleges.push({ "ID": itemVal, "Notes": "" });
          addRowToTable(itemVal);
          writeUserData(1);
          suggestions.style.display = "none";
          currentFocus = -1;
          let removeActive = suggestions.getElementsByClassName("active")[0];
          if (removeActive != undefined) {
            removeActive.classList.remove("active");
          }
        } else {
          createToast("College already exists!");
        }
      }
    });
    this.addEventListener("focusin", function () {
      if (this.value != "") {
        suggestions.style.display = "block";
      }
    });
  }, error => {
    createToast("Load Search Data Failed!");
    console.error("Load Search Data Failed!", error);
  });
}, { once: true });
