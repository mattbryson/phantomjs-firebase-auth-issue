var token = null;

/**
 * Setup UI and check if we have a auth token or not 
 */
function initApp() {

  $('.loading').hide();
  $('#pdf').on('click', function () { getPdf('sdk'); });
  $('#pdfRest').on('click', function () { getPdf('rest'); });


  var token = getParameterByName('token');
  if (token) {
    $('.info').hide();
    getPublicItems()
      .then(auth)
      .then(getAuthedItems)
      .then(capturePDF)
      .catch(renderError);
  }
}

/**
 * Auth the user either via the JS SDK, or via the REST API
 */
function auth() {
  
  var token = getParameterByName('token');
  var auth = getParameterByName('auth');
  if (auth == 'rest') {
    return authWithRest(token);
  } else {
    return authWithSDK(token);
  }
}

/**
 * User the JS SDK to auth with custom token. 
 */
function authWithSDK(token) {
  render("Auth SDK (firebase.auth().signInWithCustomToken)...");

  return firebase.auth().signInWithCustomToken(token)
    .then(function (user) {
      render("<b>Got a user object</b>");
      render("<pre>" + JSON.stringify(user) + "</pre>");
    })
}

/**
 * Use the REST API to verify the custom token, and then manually create the local storage 
 * data for the SDK to use.
 * then trigger a storage change event so the SDK knows its authed...
 */
function authWithRest(token) {
  render("Auth Via REST API...");

  var apiKey = 'AIzaSyAAfySnVWnOWBwzE6cKrEYhAK_0vsODCcM';
  var url = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyCustomToken?key=' + apiKey;
  var payload = {
    type: "POST",
    contentType: "application/json; charset=utf-8",
    data: '{"token":"' + token + '","returnSecureToken":true}'
  };

  return $.ajax(url, payload)
    .then(function (response) {
      if (response.idToken) {

        //grab data out of the token
        var idToken = decodeToken(response.idToken);

        //set the LS key
        var key = 'firebase:authUser:' + apiKey + ':[DEFAULT]';

        //mimic the data we need to make the SDK realize we are logged in
        var value = {
          uid: idToken.user_id,
          displayName: null,
          photoURL: null,
          email: null,
          emailVerified: false,
          phoneNumber: null,
          isAnonymous: false,
          providerData: [],
          apiKey: apiKey,
          appName: null,
          authDomain: "hello-firebase-ea30c.firebaseapp.com",
          stsTokenManager: {
            apiKey: apiKey,
            refreshToken: response.refreshToken,
            accessToken: response.idToken,
            expirationTime: Date.now() + parseInt(response.expiresIn)
          },
          redirectEventId: null,
          lastLoginAt: "1515461670000",
          createdAt: "1515454515000"
        };

        //Save to LS 
        window.localStorage.setItem(key, JSON.stringify(value));

        // This will let the SDK know the user is actually authed
        window.dispatchEvent(new Event('storage'));

        render("<b>Got REST success</b>");
        render("now mimic auth state for sdk in local storage...");
      }
    });
}



/**
 * Load a collection of authenticated items
 */
function getAuthedItems() {
  render("Authed, getting items...");

  return firebase.firestore().collection('items').get()
    .then(function (snap) {
      var list = "<h2>Authed Items from firestore</h2>";
      list += "Found " + snap.docs.length + " items. Should be 3";
      list += "<table>"
      //old school for phantom
      for (var i = 0; i < snap.docs.length; i++) {
        var doc = snap.docs[i];

        list += '<tr>'
          + ' <td>' + doc.data().name + '</td>'
          + '</tr>';
      };

      list += "</table>"
      render(list);
    });

}

function getPublicItems() {


  return firebase.firestore().collection('publicItems').get()
    .then(function (snap) {
      var list = "<h2>Public Items from firestore</h2>";
      list += "Found " + snap.docs.length + " items should be 3";
      list += "<table>"
      //old school for phantom
      for (var i = 0; i < snap.docs.length; i++) {
        var doc = snap.docs[i];

        list += '<tr>'
          + ' <td>' + doc.data().name + '</td>'
          + '</tr>';
      };

      list += "</table>"
      render(list);
    });
}

/**
 * Call the HTTP Cloud Function to create a pdf.
 * Either AUTH the page with REST or SDK
 */
function getPdf(auth) {

  if (!auth) {
    auth = "sdk";
  }

  //custom api to make PDF
  var pdfURL = 'https://us-central1-hello-firebase-ea30c.cloudfunctions.net/api/pdf?auth=' + auth;

  //If we are running on local host, then hit the local host API
  if (location.host == "localhost:5000") {
    pdfURL = 'http://localhost:5001/hello-firebase-ea30c/us-central1/api/pdf?auth=' + auth;
  }

  $('.loading').show();

  $.get(pdfURL).then(function (result) {
    console.log(result);
    var docRef = firebase.storage().ref(result.path);
    return docRef.getDownloadURL()
      .then(function (url) {
        $('.loading').hide();
        render('<b>Authed via ' + auth + '</b>');
        render('<a href="' + url + '" target="new">Click here to view the generated PDF</a>');
        render('<a href="' + result.url + '" target="new">Click here to view the pre authed source HTML page</a>');
      });
  })
  .fail(function (error) {
    $('.loading').hide()      
    render(error);
  })
}


/**
 * Print error to screen 
 */
function renderError(error) {
  render(error.message);
  render(error.code);
  console.log(error.code, error.message);
  capturePDF();
}

/**
 * Render HTML to screen 
 */
function render(html) {
  $("#content").append("<br/>").append(html).append("<br/>");
}

/**
 * Tell phantom we are ready for our pdf
 */
function capturePDF() {
  if (window.callPhantom) {
    window.callPhantom();
  }
}

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
  var results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function decodeToken(idToken) {
  try {
    var payload = JSON.parse(atob(idToken.split('.')[1]));
    return payload;
  } catch (e) {
    console.log('Invalid token');
    return false;
  }
}

window.onload = function () {
  initApp();
};
