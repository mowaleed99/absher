<?php
    $input = array (
  'action' => 'submit',
  'student_id' => '18',
  'service_id' => '27',
  'student_name' => 'Test Student',
  'student_phone' => '+966500000000',
  'service_title' => 'Test Free Service',
  'details' => 'Free test',
  'pay_with_points' => false,
  'request_uuid' => 'uuid_6a64a9ac4d0264.17299933',
);
    $action = "submit";
    $studentId = 18;
    require __DIR__ . "/api/student_requests.php";
    