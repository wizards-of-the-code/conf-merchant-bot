const amqp = require('amqplib');

const rabbitmqUrl = 'amqp://rabbitmq'; // Service name in the Docker Compose file

async function connectToRabbitMQ() {
  const connection = await amqp.connect(rabbitmqUrl);
  const channel = await connection.createChannel();
  console.log(channel);
  // Your RabbitMQ-related logic here
}

export default connectToRabbitMQ;
