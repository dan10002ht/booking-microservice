// User model mẫu, có thể mở rộng khi dùng ORM/DB thực tế
class User {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }
}

export default User;