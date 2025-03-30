# Sử dụng Node.js
FROM node:22.14.0

# Đặt thư mục làm việc
WORKDIR /app

# Copy package.json và cài đặt dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy toàn bộ source code vào container
COPY . .

# Mở cổng API
EXPOSE 5000

# Chạy server
CMD ["npm", "run", "server"]
