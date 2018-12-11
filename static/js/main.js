document.addEventListener("DOMContentLoaded", () => {

const urlButton = document.getElementById("url-button");
const urlText = document.getElementById("url-text");

urlText.addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
        addCU(urlText.value);
        urlText.value = "";
    }
});

function addCU(url) {
    if (url !== "") {
        let regexp = /[a-zA-Z0-9]+\/\d+-\d+\/[12]-semestre/
        let miniURL = regexp.exec(url);
        miniURL = miniURL.toString().replace(/\//g, "_");
        fetch("/cus/" + miniURL).then(resp => resp.json()).then(cu => {
            alert(cu);
        });
    }
}

})
