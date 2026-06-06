const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

// Triggered every time a new document is created in the notices collection
exports.stampNoticeDate = onDocumentCreated(
  "notices/{noticeId}",
  async (event) => {
    const snapshot = event.data;

    if (!snapshot) {
      console.log("No data in event, skipping.");
      return;
    }

    const createdAt = snapshot.data().createdAt;

    if (!createdAt) {
      console.log("No createdAt field found, skipping.");
      return;
    }

    // Format the Firestore timestamp into a readable string
    const date = createdAt.toDate();
    const formattedDate = date.toLocaleDateString("en-GB", {
      weekday: "long",
      day:     "numeric",
      month:   "long",
      year:    "numeric",
      hour:    "2-digit",
      minute:  "2-digit",
    });

    // Write the formatted string back onto the same document
    await getFirestore()
      .collection("notices")
      .doc(event.params.noticeId)
      .update({ formattedDate });

    console.log(`Stamped notice ${event.params.noticeId}: ${formattedDate}`);
  }
);  