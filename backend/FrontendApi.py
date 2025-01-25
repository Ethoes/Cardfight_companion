from flask import Flask, jsonify, request, send_file, abort
from DatabaseService import get_data_from_db, get_image_path_by_id
import os

app = Flask(__name__)

@app.route('/hello', methods=['GET'])
def hello():
    return "Hello, World!"

@app.route('/data', methods=['POST'])
def get_data():
    data = request.get_json()
    if not data or 'query' not in data or not isinstance(data['query'], str):
        return jsonify({"error": "Invalid input"}), 400
    query = data['query']
    result = get_data_from_db(query)
    return jsonify(result)

@app.route('/card/<int:card_id>/image', methods=['GET'])
def get_card_image(card_id):
    image_path = get_image_path_by_id(card_id)
    if not image_path:
        return abort(404, description="Image not found")
    image_path = "C:\\Users\\Calvin\\python filed\\" + image_path
    if image_path and os.path.exists(image_path):
        return send_file(image_path, mimetype='image/jpeg')
    else:
        return abort(404, description="Image not found" + str(image_path))

if __name__ == '__main__':
    app.run(debug=True)