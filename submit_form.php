<?php
// Check if the form was submitted via POST
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Sanitize the email input
    $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);

    // Validate the email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        // If the email is invalid, return a JSON response with an error message
        echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
        exit;
    }

    // Define the path to the CSV file
    $file = 'email_list.csv';

    // Read the existing emails from the CSV file into an array
    $emails = array_map('str_getcsv', file($file));

    // Check if the email already exists in the CSV file
    foreach ($emails as $row) {
        if (in_array($email, $row)) {
            // If the email is found, return a JSON response indicating it's a duplicate
            echo json_encode(['success' => false, 'message' => 'You have already signed up.']);
            exit;
        }
    }

    // Open the CSV file in append mode
    $handle = fopen($file, 'a');

    // Write the new email to the CSV file
    fputcsv($handle, [$email]);

    // Close the file
    fclose($handle);

    // Return a JSON response indicating success
    echo json_encode(['success' => true, 'message' => 'Thank you for signing up!']);
}
?>
