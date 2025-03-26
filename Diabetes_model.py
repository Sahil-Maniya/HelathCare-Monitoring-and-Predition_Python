import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn import svm
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import StandardScaler

# Load the diabetes dataset
diabetes_df = pd.read_csv('/Users/sahilmaniya/Desktop/DiabetesDataset/diabetes.csv')

# Group the data by outcome to get a sense of the distribution
diabetes_mean_df = diabetes_df.groupby('Outcome').mean()

# Split the data into input and target variables
X = diabetes_df.drop('Outcome', axis=1)
y = diabetes_df['Outcome']

# Scale the input variables using StandardScaler
scaler = StandardScaler()
scaler.fit(X)
X = scaler.transform(X)

# Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=1)

# Create an SVM model with a linear kernel
model = svm.SVC(kernel='linear')

# Train the model on the training set
model.fit(X_train, y_train)

# Make predictions on the training and testing sets
train_y_pred = model.predict(X_train)
test_y_pred = model.predict(X_test)

# Calculate the accuracy of the model on the training and testing sets
train_acc = accuracy_score(train_y_pred, y_train)
test_acc = accuracy_score(test_y_pred, y_test)

# Save necessary data for app.py
model_data = {
    "model": model,
    "scaler": scaler,
    "train_acc": train_acc,
    "test_acc": test_acc,
    "diabet es_df": diabetes_df,
    "diabetes_mean_df": diabetes_mean_df
}
