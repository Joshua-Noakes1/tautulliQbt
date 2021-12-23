# From node:slim
FROM node:slim
WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get upgrade -y

# Copy files
COPY . .

# Install Node dependencies
RUN npm install

# Start app
CMD ["npm", "start"]