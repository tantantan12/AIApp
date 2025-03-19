 
document.getElementById("again-btn").addEventListener("click", () => {
    location.reload();
    gtag('event', 'again', {
        'Experiment_Condition': '{{ getenv "BRANCH" }}'
    });
});

document.getElementById("advertising-btn").addEventListener("click", async () => {
    const productName = document.getElementById("name").value;
    const productDesc = document.getElementById("desc").value;
    const productTarget = document.getElementById("target").value;

    try {
        const response = await fetchReply(productName, productDesc, productTarget);
        
        // Insert the formatted response into ad-output
        document.getElementById('ad-output').insertAdjacentText('beforeend', response);
        document.getElementById('ad-input').style.display = 'none';
        document.getElementById('ad-output').style.display = 'block';
        
        console.log("FULL PRODUCT RESPONSE:", response);

        // Show feedback buttons after output is displayed
        document.getElementById("ad-output").insertAdjacentHTML('beforeend', `
            <div id="feedback-container" style="margin-top: 20px;">
                <p>Was this result helpful?</p>
                <button id="thumbs-up" style="font-size: 20px; cursor: pointer;">👍</button>
                <button id="thumbs-down" style="font-size: 20px; cursor: pointer;">👎</button>
            </div>

            <script>
                document.getElementById("thumbs-up").addEventListener("click", () => {
                    gtag('event', 'feedback', { 'satisfied': 1 });
                    disableFeedbackButtons();
                });

                document.getElementById("thumbs-down").addEventListener("click", () => {
                    gtag('event', 'feedback', { 'satisfied': 0 });
                    disableFeedbackButtons();
                });

                function disableFeedbackButtons() {
                    document.getElementById("thumbs-up").disabled = true;
                    document.getElementById("thumbs-down").disabled = true;
                    document.getElementById("feedback-container").innerHTML = "<p>Thank you for your feedback!</p>";
                }
            </script>
        `);
    } catch (error) {
        console.error("Error Fetching Products:", error);
        alert("An error occurred while searching for products.");
    }
});
