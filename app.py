from flask import Flask,render_template, request, redirect, flash, session, url_for, jsonify
from flask_sqlalchemy import SQLAlchemy
import bcrypt
import sqlite3
import re
import string
import jwt
from functools import wraps
from datetime import datetime, timedelta
import random
from captcha.image import ImageCaptcha
from flask_caching import Cache
import numpy as np
import os
from train_model import image_pre, predict
import pickle
import google.generativeai as genai


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'secret_key'
db = SQLAlchemy(app)
cache = Cache(app, config={'CACHE_TYPE': 'simple'})


# Define User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

# Define Captcha Model


class Captcha(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    captcha_text = db.Column(db.String(10), nullable=False)
    image_path = db.Column(db.String(200), nullable=False)


# Initialize Database
with app.app_context():
    db.create_all()

# Function to validate email format
def is_valid_email(email):
    return re.match(r"[^@]+@[^@]+\.[a-zA-Z]{2,}", email)


# Function to validate password strength
def is_strong_password(password):
    return (
        len(password) >= 8 and
        any(char.isdigit() for char in password) and
        any(char.isupper() for char in password) and
        any(char.islower() for char in password) and
        any(char in string.punctuation for char in password)
    )


def generate_captcha_text(length=5):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

# Generate a random CAPTCHA text


def generate_captcha_text(length=5):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


def generate_captcha():
    captcha_text = generate_captcha_text()
    session['captcha_text'] = captcha_text
    image = ImageCaptcha()
    image_path = "static/captcha.png"
    image.write(captcha_text, image_path)
    return image_path

# captcha generate


@app.route('/generate_captcha')
def refresh_captcha():
    captcha_path = generate_captcha()
    return jsonify({"captcha_path": captcha_path})

# Index Route


@app.route('/')
def splash():
    return render_template('splash.html')

# <! ------------------------------------ Register --------------------------------------------!>

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']
        captcha_input = request.form['captcha']

        if 'captcha_text' not in session:
            flash("CAPTCHA expired. Please try again.", "danger")
            return redirect(url_for('register'))

        if captcha_input.upper() != session.get('captcha_text'):
            flash("Invalid CAPTCHA! Please try again.", "danger")
            return redirect(url_for('register'))

        if not is_valid_email(email):
            flash("Invalid email format.", "danger")
            return redirect(url_for('register'))

        if not is_strong_password(password):
            flash("Password must be at least 8 characters long, contain an uppercase letter, lowercase letter, a number, and a special character.", "danger")
            return redirect(url_for('register'))

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash('Email already registered. Please log in.', 'danger')
            return redirect(url_for('login'))

        hashed_password = bcrypt.hashpw(password.encode(
            'utf-8'), bcrypt.gensalt()).decode('utf-8')
        new_user = User(name=name, email=email, password=hashed_password)

        db.session.add(new_user)
        db.session.commit()

        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))

    show_flash = request.args.get("show_flash", "false")
    captcha_path = generate_captcha()
    return render_template('register.html', captcha_path=captcha_path, show_flash=show_flash)

# Generate JWT Token

def generate_token(email):
    expiration_time = datetime.utcnow() + timedelta(hours=1)
    token = jwt.encode({'email': email, 'exp': expiration_time},
                       app.config['SECRET_KEY'], algorithm="HS256")
    return token

# <!---------------------------------------- Login --------------------------------------------!>

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        # Check if user exists
        user = User.query.filter_by(email=email).first()
        if not user:
            flash('No account found with this email. Please register.', 'danger')
            return redirect(url_for('register'))

        if bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):

            token = generate_token(user.email)
            session['token'] = token

            session['email'] = user.email

            flash('Login successful!', 'success')

            return redirect(url_for('dashboard'))
        else:
            flash('Invalid email or password.', 'danger')
            return redirect(url_for('login'))

    return render_template('login.html')


# Token required decorator
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = session.get('token')
        if not token:
            flash("Token is missing! Please log in again.", "danger")
            return redirect(url_for('login'))
        try:
            data = jwt.decode(
                token, app.config['SECRET_KEY'], algorithms=["HS256"])
            session['email'] = data['email']
        except jwt.ExpiredSignatureError:
            flash("Session expired. Please log in again.", "danger")
            return redirect(url_for('login'))
        except jwt.InvalidTokenError:
            flash("Invalid session token! Please log in again.", "danger")
            return redirect(url_for('login'))

        return f(*args, **kwargs)

    return decorated


def get_current_user():
    email = session.get('email')
    if email:
        return User.query.filter_by(email=email).first()
    return None

# <!-------------------------------------------- Dashboard -------------------------------------!>


@app.route('/dashboard')
@login_required
def dashboard():
    user = get_current_user()
    if not user:
        flash("User not found. Please log in again.", "danger")
        return redirect(url_for('login'))

    health = get_health_data(user.id)
    return render_template('dashboard.html', user=user, health=health)


@app.route("/update_health", methods=["POST"])
def update_health():
    data = request.json
    user_id = data["user_id"]
    health_metrics = data["metrics"]

    conn = sqlite3.connect("health.db")
    cursor = conn.cursor()

    for metric, value in health_metrics.items():
        cursor.execute("INSERT INTO health_data (user_id, metric, value) VALUES (?, ?, ?)",
                       (user_id, metric, value))

    conn.commit()
    conn.close()

    return jsonify({"message": "Health data updated successfully!"})


@app.route("/get_health_data/<int:user_id>")
def get_health_data(user_id):
    conn = sqlite3.connect("health.db")
    cursor = conn.cursor()
    cursor.execute(
        "SELECT metric, value FROM health_data WHERE user_id = ?", (user_id,))
    data = cursor.fetchall()
    conn.close()

    health_dict = {}
    for metric, value in data:
        health_dict[metric] = value

    return jsonify(health_dict)


# <!------------------------------------------------ Chatbot ------------------------------------------------!>

genai.configure(api_key='AIzaSyCajCM6jhhRaXuBpV-9CpS89BLOp_TFuv4')
API_URL = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=AIzaSyCajCM6jhhRaXuBpV-9CpS89BLOp_TFuv4"
chat_history = []

def get_gemini_response(user_input):
    global chat_history
    # Add user input to history
    chat_history.append(f"User: {user_input}")
    
    recent_conversation = "\n".join(chat_history[-4:])
    prompt = f"""
    You are a highly skilled medical expert with deep knowledge of healthcare, medicine, and treatments.
    Your responsibility is to ONLY answer questions related to health, medicine, diseases, symptoms,
    treatments, healthcare, and medical advice.

    🚫 If the user asks anything that is NOT related to healthcare, you must politely decline by saying:
    "⚠️ I'm sorry, but I can only response the health-related questions. Please ask me anything related to healthcare."


    Be concise — respond in no more than 2-3 sentences.
    
    Conversation so far:
    {recent_conversation}
    
    ✅ Now answer the user's question as a medical professional:
    
    User Question: {user_input}
    """
    try:
        model = genai.GenerativeModel('models/gemini-2.5-pro')
        response = model.generate_content(prompt, generation_config={
        "temperature": 0.5,
        "top_p": 0.8,
        "max_output_tokens": 60  
    })

        # ✅ DEBUG PRINT
        print("FULL RAW RESPONSE:", response)

        # ✅ Safe way to extract content
        if response and hasattr(response, 'candidates') and response.candidates:
            parts = response.candidates[0].content.parts
            if parts and len(parts) > 0 and hasattr(parts[0], 'text'):
                final_text = parts[0].text.strip()
                chat_history.append(f"Gemini: {final_text}")
                
                # ✅ Post-processing: keep only first 3 sentences max
                sentences = final_text.split(". ")
                short_response = ". ".join(sentences[:3]) + ("." if not sentences[0].endswith(".") else "")
                return short_response            
            
            else:
                return "⚠️ Gemini responded but no message found."
        else:
            return "⚠️ Gemini API returned no content."

    except Exception as e:
        print("Gemini Error:", e)
        return f"❌ Gemini Error: {str(e)}"

# Route to render the chat page
@app.route('/chat')
def chat():
    user = get_current_user()
    if user:
        return render_template('chat.html', user=user)
    else:
        flash("User not found. Please log in again.", "danger")
        return redirect(url_for('login'))

# Chatbot API Route (This API Will Only Answer Healthcare-Related Questions)
@app.route('/chatbot_api', methods=['POST'])
def chatbot_api():
    try:
        data = request.get_json()
        user_input = data.get("message", "").strip()

        print("📥 User input received:", user_input)

        if not user_input:
            return jsonify({'response': "⚠️ Please enter a valid message."})
        
        greetings = ["hi", "hello", "hey", "hii", "hola"]
        if user_input in greetings:
            return jsonify({'response': "👋 Hello! please ask a question related to healthcare."})


        response = get_gemini_response(user_input)

        print("🤖 Gemini Response being sent to frontend:", response)

        return jsonify({'response': response})
    
    except Exception as e:
        print("❌ Server Exception:", e)
        return jsonify({'response': f"❌ Server error: {str(e)}"})

# Error Handling API Route (Optional)
@app.route("/get_response", methods=["POST"])
def get_bot_response():
    """Chatbot API that processes user input and returns healthcare-related answers."""
    try:
        data = request.get_json()
        user_message = data.get("message", "")

        if not user_message:
            return jsonify({"response": "⚠️ Please enter a valid question."})

        # Get chatbot response
        bot_response = get_gemini_response(user_message)
        return jsonify({"response": bot_response})

    except Exception as e:
        return jsonify({"response": f"❌ Error: {str(e)}"})

# Logout Route

@app.route('/logout')
def logout():
    session.pop('token', None)
    flash('You have been logged out.', 'info')
    return redirect(url_for('splash'))


# <!------------------------------------Brain Tumour Detection--------------------------------!>
UPLOAD_FOLDER = '/Users/sahilmaniya/Desktop/Login_Module/static'
ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'tif'])
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


@app.route('/brain_tumor_detection', methods=['GET', 'POST'])
def upload_file():
    user = get_current_user()
    if not user:
        flash("User not found. Please log in again.", "danger")
        return redirect(url_for('login'))
    result = None

    if request.method == 'POST':
        if 'file1' not in request.files:
            return 'there is no file1 in form!'
        file1 = request.files['file1']
        path = os.path.join(app.config['UPLOAD_FOLDER'], 'output.jpg')
        file1.save(path)
        data = image_pre(path)
        s = predict(data)
        if s == 1:
            result = 'No Brain Cancer'
        else:
            result = 'Brain Cancer'
    return render_template('brain_tumor_detection.html', result=result, user=user)


# <!---------------------------------------diabetes prediction--------------------------------!>
try:
    model = pickle.load(open('diabetes.pkl', 'rb'))
except Exception as e:
    print("Error loading model:", e)
    model = None


@app.route('/diabetes_prediction')
def diabetes_prediction():
    user = get_current_user()
    if user:
        return render_template('diabetes_prediction.html', user=user)
    else:
        flash("User not found. Please log in again.", "danger")
        return redirect(url_for('login'))


@app.route('/y_predict', methods=['POST'])
def y_predict():
    """
    Predicts the likelihood of diabetes based on user input.
    """
    try:
        user = get_current_user()
        if not user:
            flash("User not found. Please log in again.", "danger")
            return redirect(url_for('login'))

        features = [float(x) for x in request.form.values()]
        x_test = np.array(features).reshape(1, -1)

        if model is None:
            return render_template('diabetes_prediction.html', prediction_text="Model is not available.")

        prediction = model.predict(x_test)

        if hasattr(model, "predict_proba"):
            probability = model.predict_proba(x_test)[0][1]
            output = 1 if probability >= 0.5 else 0
        else:
            output = prediction[0]
        if output == 0:
            result_message = "✅ No diabetes detected. Stay healthy! 🍏"
        else:
            result_message = "⚠️ High chance of diabetes! Consult a doctor. 🏥"
        return render_template('diabetes_prediction.html', user=user, prediction_text=result_message)

    except Exception as e:
        print("Prediction Error:", e)
        return render_template('diabetes_prediction.html', user=user, prediction_text="Error in prediction. Please check input values.")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5005)
