from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

#Load sentence transformer pretrained model from Hugging Face (https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2), Using FAISS (Facebook AI Similarity Search) to make semantic search fast and scalable. Got the idea of using FAISS from https://towardsdatascience.com/how-to-build-a-semantic-search-engine-with-transformers-and-faiss-dcbea307a0e8/
model = SentenceTransformer("all-MiniLM-L6-v2")
embedding_dim = 384

#Dictionary to hold indices and bug id lists per application
app_indices = {}
app_bug_ids = {}

priority_classification_indices = {}
priority_bug_ids = {}

#Combine bug fields into a single string for embedding
def build_text_input(title, description, steps, user_steps):
    step1 = user_steps.get("step1", "")
    step2 = user_steps.get("step2", "")
    return f"{title} {description} {steps or ''} {step1} {step2}"

#Convert text into normalized vector for cosine similarity
def embed_text(text):
    return model.encode([text],normalize_embeddings=True)

#Set up FAISS index and bug id list for the app if not already done
def app_setup(app_name):
    if app_name not in app_indices:
        app_indices[app_name] = faiss.IndexFlatIP(embedding_dim)
        app_bug_ids[app_name] = []

#Set up FAISS index for priority classification (with status in "Closed") and bug id list for the app if not already done
def priority_app_setup(app_name):
    if app_name not in priority_classification_indices:
        priority_classification_indices[app_name] = faiss.IndexFlatIP(embedding_dim)
        priority_bug_ids[app_name] = []

#Add bug embedding and its id to the app's index
def add_to_index(app_name, bug_id, text):
    app_setup(app_name)
    vector = embed_text(text)
    app_indices[app_name].add(np.array(vector))
    app_bug_ids[app_name].append(bug_id)

#Add bug embedding and its id to the app's index
def add_to_priority_index(app_name, bug_id, text):
    priority_app_setup(app_name)
    vector = embed_text(text)
    priority_classification_indices[app_name].add(np.array(vector))
    priority_bug_ids[app_name].append(bug_id)


#Find top k similar bugs with similarity score greater than equal to min_score
def search_similar(app_name, text, k=3, min_score=0.6):
    #Return [] if the app has no index or no bugs stored
    if app_name not in app_indices or not app_bug_ids[app_name]:
        return []

    #Convert bug text to vector (list of numbers)
    vector = embed_text(text)

    #Search the FAISS index for top k similar bug vectors
    scores, indices = app_indices[app_name].search(np.array(vector), k)

    results = []
    for i in range(k):
        score = float(scores[0][i])
        index = indices[0][i]
        
        #if the index is valid and score is above threshold, add the result
        if index < len(app_bug_ids[app_name]) and score >= min_score:
            bug_id = app_bug_ids[app_name][index]
            results.append((bug_id, score))
            
    #Sort in descending order based on score
    results.sort(key=lambda x: -x[1])
    return results

#Find top k similar bugs in the priority index with similarity score greater than equal to min_score
def search_similar_priority_bugs(app_name, text, k=3, min_score=0.5):
    #Return [] if the app has no index or no bugs stored
    if app_name not in priority_classification_indices or not priority_bug_ids[app_name]:
        return []
    
    #Convert bug text to vector (list of numbers)
    vector = embed_text(text)

    #Search the FAISS index for top k similar bug vectors
    scores, indices = priority_classification_indices[app_name].search(np.array(vector), k)

    results = []
    for i in range(k):
        score = float(scores[0][i])
        index = indices[0][i]
        
        #if the index is valid and score is above threshold, add the result
        if index < len(priority_bug_ids[app_name]) and score >= min_score:
            bug_id = priority_bug_ids[app_name][index]
            results.append((bug_id, score))

    #Sort in descending order based on score
    results.sort(key=lambda x: -x[1])
    return results
