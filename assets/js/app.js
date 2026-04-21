const interfaceVariations = 2;
const tapLimit = 50;

let sessionId = null;

let platformVariable;

let tapLogsArray = [];

let interfaceSequence = 1;
let showFeedback = false;
let tapCounter = 0;
let tapStartTime = 0;
let totalTouchDuration = 0;

let actionContainer, actionText, feedback, feedbackValue, platformContainer, startNext, tapAgain, tapContainer;

function onLoad() {
    actionContainer = document.getElementById("actionContainer");
    actionText = document.getElementById("actionText");
    feedback = document.getElementById("feedback");
    feedbackValue = document.getElementById("feedbackValue");
    platformContainer = document.getElementById("platformContainer");
    tapContainer = document.getElementById("tapContainer");
    startNext = document.getElementById("startNext");
    tapAgain = document.getElementById("tapAgain");

    showFeedback = Math.random() < 0.5;

    const tapHereElement = document.getElementById('tapHere');

    //Set mouse and touch listeners
    const events = ["mouseup", "mousedown", "touchstart", "touchend"];

    for (const event of events) {
        tapHereElement.addEventListener(event, tapityTap);
    }

}

async function initializeSession() {
    try {
        const res = await fetch("/api/startSession", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();
        sessionId = data.sessionId;

        console.log("Session started:", sessionId);

    } catch (err) {
        console.error("Session init failed:", err);
    }
}

function savePlatform(platform){
    platformVariable = platform;

    actionContainer.style.display="flex";
    platformContainer.style.display = "none";
    tapContainer.style.display = "block";

    initializeSession();
}

function tapityTap(tapEventObject){
    const tapEvent = tapEventObject.type;

    console.log("Tap Event: "+tapEvent);

    switch(tapEvent){

        case "touchstart":
        tapEventObject.preventDefault();
        // fall through

        case "mousedown":
        tapStartTime = Date.now();
        break;

        case "touchend":
        tapEventObject.preventDefault();
        // fall through

        case "mouseup":
        const tapEndTime = Date.now();

        let tapDuration = 0
        if (tapStartTime > 0) {
            tapDuration = (tapEndTime - tapStartTime);
        } else {
            console.log("Invalid Tap Start Time: " + tapStartTime);
            break;
        }

        if (tapDuration > 0){
            console.log("Tap Count: " + tapCounter + "; Tap duration: " + tapDuration + " ms");
            tapCounter++;

            totalTouchDuration += tapDuration;
            const meanTouchDuration = totalTouchDuration / tapCounter;

            let tap = {};
            
            tap["tapSequenceNumber"] = tapCounter;
            tap["startTimestamp"] = tapStartTime;
            tap["endTimestamp"] = tapEndTime;

            if(showFeedback) {
                if (tapCounter == 1) {
                    actionText.style.display = "none";
                    feedback.style.display = "flex";
                }
                feedbackValue.textContent = meanTouchDuration.toFixed(2);
            }

            tapLogsArray.push(tap);

            if (tapCounter >= tapLimit) {
                actionText.style.display = "none";
                feedback.style.display = "flex";
                feedbackValue.textContent = meanTouchDuration.toFixed(2);
                tapContainer.style.display="none";

                if (interfaceSequence < interfaceVariations) {
                    startNext.style.display="block";
                } else {
                    tapAgain.style.display="block";
                }

                syncToServer();

                interfaceSequence++;

                return;
            }

        }

        tapStartTime = 0;
        break;
    }

}

async function syncToServer() {
    try {
        const payload = {
            sessionId: sessionId,
            platform: platformVariable,
            interfaceSequence: interfaceSequence,
            interfaceType: showFeedback ? "feedback" : "no-feedback",
            taps: tapLogsArray
        };

        const res = await fetch("/api/saveTaps", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!data.success) {
            console.log("Server went away. Try again.");
        } else {
            console.log("Data saved successfully.");
        }

    } catch (err) {
        console.error(err);
    }
}

function startNextRound(){
    tapCounter = 0;
    tapStartTime = 0;
    totalTouchDuration = 0;
    showFeedback = !showFeedback;

    actionText.style.display="block";
    feedback.style.display="none";
    startNext.style.display="none";
    tapContainer.style.display="block";
}

function tapAgainReload() {
    location.reload();
}

window.addEventListener('load', () => {
    onLoad();
    console.log("Page loaded!");
});