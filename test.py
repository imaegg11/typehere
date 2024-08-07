from flask import Flask, jsonify, request
from json import dump, loads

app = Flask("test")

@app.route("/")
def default():
    return jsonify({
        "Hello": "weeeeeeeeee!"
    })

@app.route("/postData", methods=['POST'])
def postData():
    with open("data.json", "w") as f:
        dump(loads(request.data), f)

    # print(loads(request.data))

    return jsonify({
        "Weeeeee": 300
    })

@app.route('/test', methods=['GET'])
def test():
    return jsonify({
        "Weeeeee": 300
    })

if __name__ == "__main__":
    app.run(debug=True)