let net;
const webcamElement = document.getElementById("webcam");
const classifier = knnClassifier.create();
async function app() {
  console.log("Loading mobilenet..");

  // Load the model.
  net = await mobilenet.load();
  console.log("Sucessfully loaded model");

  // Make a prediction through the model on our image.
  const imgEl = document.getElementById("img");
  const result = await net.classify(imgEl);
  console.log(result);
}
async function setupWebcam() {
  return new Promise((resolve, reject) => {
    const navigatorAny = navigator;
    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigatorAny.webkitGetUserMedia ||
      navigatorAny.mozGetUserMedia ||
      navigatorAny.msGetUserMedia;
    if (navigator.getUserMedia) {
      navigator.getUserMedia(
        { video: { 
          facingMode: { exact: "environment" }
        } },
        stream => {
          webcamElement.srcObject = stream;
          webcamElement.addEventListener("loadeddata", () => resolve(), false);
        },
        error => reject()
      );
    } else {
      reject();
    }
  });
}

async function app() {
  console.log("Loading mobilenet..");
  const classes = ["127.0.0.1/1", "127.0.0.1/2"];
  // Load the model.
  net = await mobilenet.load();
  console.log("Sucessfully loaded model");

  await setupWebcam();

  let changeOutput = idx => {
    classes[idx - 1] = document.getElementById(`input-class-${idx}`).value;
    //console.log(classes);
  };
  const addButton = () => {
    let btnList = document.getElementById("button-list");

    console.log(btnList.children.length);
    let length = btnList.children.length + 1;

    let ell = document.createElement("DIV");
    ell.classList = "ui text container segment";
    ell.id = `class-${length}`;
    let c1 = document.createElement("DIV");
    c1.classList = "ui top attached label";
    c1.id = `text-class-${length}`;

    c1.innerHTML = `Action ${length}`;
    let c2 = document.createElement("DIV");
    c2.classList = "ui grid";
    let c21 = document.createElement("DIV");
    c21.classList = "four wide column";
    let c211 = document.createElement("DIV");
    c211.classList = "ui vertical animated large button blue";
    c211.id = `train-class-${length}`;
    c211.tabIndex = "0";
    c211.addEventListener("click", () => addExample(length - 1));

    let c2111 = document.createElement("DIV");
    c2111.id = `prediction-class-${length}`;
    c2111.classList = "hidden content";
    c2111.innerHTML = "0.00";

    let c2112 = document.createElement("DIV");
    c2112.classList = "visible content";
    c2112.innerHTML = "Train";

    let c22 = document.createElement("DIV");
    c22.classList = "twelve wide right floated column";
    let c221 = document.createElement("DIV");
    c221.classList = "ui labeled input";
    let c2211 = document.createElement("DIV");
    c2211.classList = "ui label";
    c2211.innerHTML = "http://";
    let c2212 = document.createElement("INPUT");
    c2212.id = `input-class-${length}`;
    c2212.addEventListener("input", () => changeOutput(length));
    c2212.type = "text";
    c2212.placeholder = `127.0.0.1/${length}`;

    c221.appendChild(c2211);
    c221.appendChild(c2212);
    c22.appendChild(c221);
    c211.appendChild(c2111);
    c211.appendChild(c2112);
    c21.appendChild(c211);
    c2.appendChild(c21);
    c2.appendChild(c22);
    ell.appendChild(c1);
    ell.appendChild(c2);
    btnList.appendChild(ell);
    classes.push(`127.0.0.1/${length}`);
  };
  // Reads an image from the webcam and associates it with a specific class
  // index.
  let connected = false;
  const connectApp = () => {
    if (connected) {
      connected = false;
      document.getElementById("connect").classList = "ui icon button";
    } else {
      connected = true;
      document.getElementById("connect").classList = "ui icon button green";
    }
  };

  const addExample = classId => {
    // Get the intermediate activation of MobileNet 'conv_preds' and pass that
    // to the KNN classifier.

    const activation = net.infer(webcamElement, "conv_preds");

    // Pass the intermediate activation to the classifier.
    classifier.addExample(activation, classId);
  };

  // When clicking a button, add an example for that class.
  document.getElementById("add-button").addEventListener("click", addButton);
  document
    .getElementById("train-class-1")
    .addEventListener("click", () => addExample(0));
  document
    .getElementById("input-class-1")
    .addEventListener("input", () => changeOutput(1));
  document
    .getElementById("train-class-2")
    .addEventListener("click", () => addExample(1));
  document
    .getElementById("input-class-2")
    .addEventListener("input", () => changeOutput(2));
  document.getElementById("connect").addEventListener("click", connectApp);
  while (true) {
    if (classifier.getNumClasses() > 0) {
      // Get the activation from mobilenet from the webcam.
      const activation = net.infer(webcamElement, "conv_preds");
      // Get the most likely class and confidences from the classifier module.
      const result = await classifier.predictClass(activation);
      if(connected){
        fetch(`http://${classes[result.classIndex]}`);
      }
      //fetch(classes[result.classIndex]);
      //document.getElementById("console").innerText = `
      //    prediction: ${classes[result.classIndex]}\n
      //    probability: ${result.confidences[result.classIndex]}
      //  `;
      for (let i = 0; i < classes.length; i++) {
        if (i == result.classIndex) {
          document.getElementById(`text-class-${i + 1}`).classList =
            "ui top attached label green";
        } else {
          let color; //='orange';

          document.getElementById(
            `text-class-${i + 1}`
          ).classList = `ui top attached label ${color}`;
        }
        document.getElementById(`prediction-class-${i + 1}`).innerHTML =
          result.confidences[i];
      }
    }

    await tf.nextFrame();
  }
}

app();
