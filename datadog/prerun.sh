# Disable the Datadog Agent based on dyno type
if [ "$DYNO" == "worker.1" ]; then
  DISABLE_DATADOG_AGENT="true"
fi

if [ "$DYNOTYPE" == "release" ]; then
  DISABLE_DATADOG_AGENT="true"
fi