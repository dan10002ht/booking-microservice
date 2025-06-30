const users = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' }
];

const findById = async (id) => users.find(u => u.id === id);

export default { findById };