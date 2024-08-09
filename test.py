from flask import Flask, jsonify, request
from json import dump, loads

app = Flask("test")
API_KEY = "nuhuh"

@app.route("/")
def default():
    return jsonify({"Status": "Success" }), 200

@app.route("/postData", methods=['POST'])
def postData():

    auth = request.headers["Authorization"]

    if API_KEY != "" and auth != API_KEY:
        return jsonify({"Status": "Unauthorized"}), 401

    with open("data.json", "w") as f:
        dump(loads(request.data), f, indent=4)


    return jsonify({"Status": "Success!" }), 200

if __name__ == "__main__":
    app.run(debug=True)