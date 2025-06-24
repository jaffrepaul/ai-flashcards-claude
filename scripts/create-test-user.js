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

async function createTestUser() {
  try {
    console.log('Creating/updating test user...');
    // Try to create the user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: 'test@example.com',
        password: 'test123',
        email_confirm: true, // Auto-confirm the email
        user_metadata: {
          name: 'Test User',
        },
      });

    if (!authError) {
      console.log('✅ Test user created successfully!');
      console.log('Email: test@example.com');
      console.log('Password: test123');
      console.log('User ID:', authData.user.id);
      return;
    }

    if (
      authError &&
      authError.message &&
      authError.message.includes('registered')
    ) {
      // User exists, find user by email
      console.log('User already exists, updating password...');
      // List users and find by email
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

      if (!foundUser) {
        console.error('Could not find user with email test@example.com');
        return;
      }
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        foundUser.id,
        { password: 'test123' }
      );
      if (updateError) {
        console.error('Error updating user:', updateError);
        return;
      }
      console.log('✅ Test user password updated successfully!');
      console.log('Email: test@example.com');
      console.log('Password: test123');
      console.log('User ID:', foundUser.id);
      return;
    }

    if (authError) {
      console.error('Error creating user:', authError);
      return;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestUser();
