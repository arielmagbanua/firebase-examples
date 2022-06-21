PROJECT_ID="fir-examples-1f2df"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com \
  --role=roles/cloudtasks.enqueuer

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com \
  --role=roles/cloudtasks.tasks.create

gcloud functions add-iam-policy-binding createDocumentTask \
  --region=us-central1 \
  --member=serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com \
  --role=roles/cloudfunctions.invoker
