import joblib
model = joblib.load('models/saved/complaint_classifier.pkl')
prior = joblib.load('models/saved/priority_detector.pkl')

tests = [
    "fire in my room",
    "medical emergency in corridor",
    "someone is bleeding help",
    "my room got short circuit"
]

for t in tests:
    cat = model.predict([t])[0]
    pri = prior.predict([t])[0]
    print(f"'{t}' -> Category: {cat}, Priority: {pri}")
