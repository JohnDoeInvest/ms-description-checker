const topicName = 'test-topic'
const mutipleTopics = [topicName, topicName];

({}).subscribe([topicName]);
({}).subscribe(mutipleTopics);
({}).produce(topicName)
