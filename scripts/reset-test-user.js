const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetTestUser() {
  try {
    console.log('Resetting test user...');

    // Find the existing user
    let foundUser = null;
    let nextPage = null;

    do {
      const { data: usersData, error: usersError } =
        await supabase.auth.admin.listUsers({ page: nextPage });
      if (usersError) {
        console.error('Error listing users:', usersError);
        return;
      }
      foundUser = usersData.users.find(u => u.email === 'test@example.com');
      nextPage = usersData.nextPage;
    } while (!foundUser && nextPage);

    if (foundUser) {
      console.log('Found existing user, deleting...');
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        foundUser.id
      );
      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        return;
      }
      console.log('✅ Existing user deleted successfully');
    }

    // Wait a moment for deletion to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create fresh user
    console.log('Creating fresh test user...');
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: 'test@example.com',
        password: 'test123',
        email_confirm: true,
        user_metadata: {
          name: 'Test User',
        },
      });

    if (authError) {
      console.error('Error creating user:', authError);
      return;
    }

    console.log('✅ Fresh test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: test123');
    console.log('User ID:', authData.user.id);
    console.log('\nYou can now log in with these credentials!');
  } catch (error) {
    console.error('Error:', error);
  }
}

resetTestUser();
