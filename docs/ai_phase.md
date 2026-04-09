 🧠 AI Development in 6 Phases

---

# 🟢 Phase 1: AI Setup & Problem Definition

## 🎯 Goal:

Define what AI features you’ll build + set up environment

## ✅ Steps:

### 1. Create AI service folder

```bash
mkdir ai-service
cd ai-service
```

---

### 2. Setup Python environment

```bash
pip install flask scikit-learn pandas numpy
```

(For NLP later)

```bash
pip install nltk spacy
```

---

### 3. Decide AI features (clear scope)

You will implement:

* Complaint classification
* Priority detection
* Room allocation (clustering)
* Sentiment analysis
* (Optional) Fee prediction

---

### 4. Create basic API server

```python
from flask import Flask
app = Flask(__name__)

@app.route("/")
def home():
    return "AI Service Running"
```

---

# 🟡 Phase 2: Data Collection & Preparation

## 🎯 Goal:

Prepare dataset for training models

## ✅ Steps:

---

### 1. Create sample datasets (VERY IMPORTANT)

#### Complaint dataset (manual)

```csv
text,category
"water leakage in bathroom",Plumbing
"fan not working",Electrical
"room is dirty",Cleanliness
```

---

### 2. Priority dataset

```csv
text,priority
"flooding water everywhere",High
"light flickering",Medium
"minor dust issue",Low
```

---

### 3. Sentiment dataset

* Use:

  * Positive
  * Negative

---

### 4. Clean data

* Lowercase text
* Remove punctuation
* Tokenization (basic)

---

### 5. Convert text → numbers

Use:

* TF-IDF vectorizer

---

# 🔵 Phase 3: Complaint Classification Model

## 🎯 Goal:

Train model to classify complaints

## ✅ Steps:

---

### 1. Import libraries

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
```

---

### 2. Train model

```python
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(texts)

model = LogisticRegression()
model.fit(X, labels)
```

---

### 3. Prediction function

```python
def predict_category(text):
    vec = vectorizer.transform([text])
    return model.predict(vec)[0]
```

---

### 4. API endpoint

```python
@app.route('/classify', methods=['POST'])
def classify():
    text = request.json['text']
    category = predict_category(text)
    return {"category": category}
```

---

# 🟠 Phase 4: Priority Detection + Sentiment Analysis

## 🎯 Goal:

Add intelligence to complaint system

## ✅ Steps:

---

### 1. Priority detection model

* Same process as classification
* Labels: High / Medium / Low

---

### 2. Combine outputs

```python
def analyze(text):
    return {
        "category": predict_category(text),
        "priority": predict_priority(text)
    }
```

---

### 3. Sentiment analysis

Simple approach:

```python
if "bad" in text:
    return "Negative"
```

OR use:

```python
from textblob import TextBlob
```

---

### 4. API endpoint

```python
@app.route('/analyze', methods=['POST'])
def analyze_api():
    text = request.json['text']
    return analyze(text)
```

---

# 🟣 Phase 5: Smart Room Allocation (Clustering)

## 🎯 Goal:

Use ML to assign rooms intelligently

## ✅ Steps:

---

### 1. Create dataset

```csv
student,night_owl,cleanliness,noise
A,1,0,1
B,0,1,0
```

---

### 2. Use K-Means clustering

```python
from sklearn.cluster import KMeans

kmeans = KMeans(n_clusters=3)
kmeans.fit(data)
```

---

### 3. Assign cluster (room group)

```python
cluster = kmeans.predict(new_student_data)
```

---

### 4. API endpoint

```python
@app.route('/room-allocate', methods=['POST'])
def allocate():
    data = request.json
    cluster = kmeans.predict([data])
    return {"room_group": int(cluster[0])}
```

---

# 🔴 Phase 6: Integration, Optimization & Deployment

## 🎯 Goal:

Make AI usable in real system

## ✅ Steps:

---

### 1. Connect with backend (Node.js)

* Use REST APIs:

  * `/analyze`
  * `/room-allocate`

---

### 2. Save models

```python
import joblib
joblib.dump(model, "model.pkl")
```

Load later:

```python
model = joblib.load("model.pkl")
```

---

### 3. Error handling

* If model fails → return default response

---

### 4. Improve accuracy (optional)

* Add more training data
* Try better models:

  * Naive Bayes
  * Random Forest

---

### 5. Deploy AI service

* Render / Railway / AWS

---

### 6. Performance optimization

* Cache results
* Reduce API latency
