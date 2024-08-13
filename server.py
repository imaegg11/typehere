from flask import Flask, jsonify, request
from json import dump, loads
from dotenv import load_dotenv
import os.path
import os

load_dotenv()
app = Flask("test")
API_KEY = os.getenv('API_KEY')

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

@app.route("/getData", methods=['GET'])
def getData():

    auth = request.headers["Authorization"]

    if API_KEY != "" and auth != API_KEY:
        return jsonify({"Status": "Unauthorized"}), 401

    if not os.path.isfile("data.json"):
        return jsonify({"Status": "File Not Found"}), 404

    text = None
    with open("data.json", "r") as f:
        text = f.read()

    if text == "":
        return jsonify({"Status": "File Empty"}), 404

    return jsonify(text), 200


if __name__ == "__main__":
    app.run(debug=True)