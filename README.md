# Firebase web SDK under phantomJS fails to authenticate with signInWithCustomToken

This project is to demonstrate a bug in the Firebase Web SDK.

Calling `signInWithCustomToken` fails with `auth/network-request-failed.` `A network error (such as timeout, interrupted connection or unreachable host) has occurred.`

But ONLY when running the cloud function / pantomJS on the firebase hosting.
Serving the cloud functions / phantom locally (and still capturing a firebase hosted web app) works fine.

## Setup
  * A HTTP cloud function uses pantomJS to capture an authenticated firebase hosted web app.
  * The cloud function creates a custom token with `admin.auth().createCustomToken`.
  * A url to the hosted firebaseapp app is created, with the token appended as a query param.
  * The URL is given to phantomjs to create a pdf of the page.
  * When the firebase webapp boots, it grabs the token, and uses `firebase.auth().signInWithCustomToken`
  * On success of the sign in, it tells phantom to take the PDF.
  * The cloud function then saves the pdf in firebase `storage`
  * The http cloud function then returns to the user / web app with the URL of the document.

This all works fine in the browser, but fails under phantom ONLY when hosted on firebase.

## Reproduce

### Hosted (fails)
go to [https://hello-firebase-ea30c.firebaseapp.com], and press the 'Create PDF (Auth with SDK)' button.

This will generate the PDF, return the file AND return the pre authed URL created by the cloud function for you to see in the browser.

The PDF will show the network error.
The URL it was taken from will work fine in the browser.

### Local (works)
Check out this repo and run

`cd functions && npm install && cd ../`  

then

`firebase serve --only functions,hosting`  

Ensure that the functions are running under port 5001.
If not you must update the following file to match your port number

`/public/main.js line 183`

Then open the locally hosted web app, hit the same buttons and you will get a working PDF, and a working URL.
The PDF is created using the HOSTED web app, the only difference is that phantom is running locally.

## Attempted Workaround.

I attempted a workaround via the `REST API`, but its very messy and still fails.

  * Enable CORS in the firestore hosting rules.
  * In the web app, validate the custom token via the rest API (which works)
  * Then create the localstorage data that the SDK needs to know the user is authed
  * Triggered a local storage change event to tell the SDK of changes
  * Load authed data.

This makes the SDK realise the user is authed, and it can then make authenticated requests to data successfully.  However, the calls return EMPTY collections, where there is data.  Again, this is only when hosted on firebase.


## Error Logs
The only other error that I can see, which occurs only under phantom, and appears to occur in BOTH success and failure situations is:

  
This is reported from phantom's `onResourceError` handler.

<pre>
  errorCode: 5
  errorString: 'Operation canceled'
  id: 11
  status: null
  statusText: null
  url: 'https://firestore.googleapis.com/google.firestore.v1beta1.Firestore/Listen/channel?VER=8&gsessionid=E1riGQbTxDY6ygOYHTEpOr0QIr-mdiy-&SID=ZJSRrfpvJAOEQgeomvXGPQ&RID=49489&AID=8&zx=p8c4kj51fhu8&t=1'
  type: 'ResourceError'
</pre>





