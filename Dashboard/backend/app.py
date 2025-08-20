from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
import os
import logging

logging.basicConfig(level=logging.INFO)

static_dir = os.path.join(os.path.dirname(__file__), '..', 'React', 'out')
app = Flask(__name__, static_folder=static_dir)
CORS(app)

ultimas_deteccoes = []

# Serve o front-end (React buildado)
@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

# API para enviar dados de detecção (POST)
@app.route("/detections", methods=["POST"])
def receber_deteccao():
    data = request.get_json()
    objetos = data.get('objetos', [])
    tempo = data.get('tempo_ms')
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    if not objetos or tempo is None:
        return jsonify({"error": "Dados incompletos"}), 400

    registro = {
        "timestamp": timestamp,
        "objetos": objetos,
        "tempo_ms": tempo
    }

    ultimas_deteccoes.insert(0, registro)
    if len(ultimas_deteccoes) > 20:
        ultimas_deteccoes.pop()

    app.logger.info(f"Objetos recebidos: {objetos} ({tempo}ms)")
    return jsonify({"status": "recebido"}), 200

# API para listar as detecções (GET)
@app.route("/api/detections", methods=["GET"])
def listar_deteccoes():
    resposta = []
    for i, det in enumerate(ultimas_deteccoes):
        for obj in det["objetos"]:
            is_correct = not obj["classe"].endswith("_avaria")
            
            classe_nome = obj["classe"]
            categoria_final = "Desconhecida"
            if "blister" in classe_nome:
                categoria_final = "Blister"
            elif "frasco" in classe_nome:
                categoria_final = "Frasco"
            elif "caixa" in classe_nome:
                categoria_final = "Caixa"

            resposta.append({
                "id": f"{i}-{obj['classe']}",
                "timestamp": det["timestamp"].replace(" ", "T"),
                "classe": obj["classe"],
                "categoria": categoria_final,
                "correto": is_correct,
                "tempoInferencia": det["tempo_ms"]
            })
    return jsonify(resposta)

# Serve arquivos estáticos (js, css, etc.)
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
