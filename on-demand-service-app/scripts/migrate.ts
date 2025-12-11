import { createConnection } from 'typeorm';
import { User } from '../src/models/user.model';
import { Order } from '../src/models/order.model';

async function migrate() {
    const connection = await createConnection();

    // Run migrations
    await connection.synchronize();

    // Seed initial data if necessary
    const userRepository = connection.getRepository(User);
    const orderRepository = connection.getRepository(Order);

    // Example seed data
    const user = userRepository.create({
        username: 'admin',
        password: 'admin123',
        email: 'admin@example.com',
    });

    await userRepository.save(user);

    console.log('Migration and seeding completed successfully.');

    await connection.close();
}

migrate().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
});