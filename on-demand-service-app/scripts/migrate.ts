import mongoose from 'mongoose';
// Dynamic requires so compiled JS (dist) and ts-node both work
let config: any;
let User: any;
let Order: any;
try {
    // running via ts-node (source)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    config = require('../src/config').default;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    User = require('../src/models/mongo/user.schema').User;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Order = require('../src/models/mongo/order.schema').Order;
} catch (e) {
    // running compiled JS in dist
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    config = require('../config').default;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    User = require('../models/mongo/user.schema').User;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Order = require('../models/mongo/order.schema').Order;
}

async function migrate() {
    const uri = config.mongoUri;
    if (!uri) {
        console.error('MONGO_URI is not set');
        process.exit(1);
    }

    await mongoose.connect(uri);

    // Example: ensure indexes and seed an admin user if none exists
    await User.init();
    await Order.init();

    const existing = await User.findOne({ email: 'admin@example.com' }).exec();
    if (!existing) {
        const admin = new User({
            username: 'admin',
            email: 'admin@example.com',
            password: 'admin123',
        });
        await admin.save();
        console.log('Seeded admin user (bcrypt-hashed password)');
    } else {
        console.log('Admin user already exists, skipping seeding');
    }

    await mongoose.disconnect();
    console.log('Migration completed');
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});