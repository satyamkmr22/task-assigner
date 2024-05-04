import React, { useState, useEffect } from "react";
import { Navbar, Nav, Button, Modal, Form, ListGroup, Row, Col } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs, addDoc, updateDoc, doc, onSnapshot, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import Swal from "sweetalert2";

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [error, setError] = useState("");
  const [employees, setEmployees] = useState([]);
  const [groupsData, setGroupsData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const navigate = useNavigate();

  async function handleLogout() {
    setError("");
    try {
      await logout();
      navigate("/login");
    } catch {
      setError("Failed to logout");
    }
  }

  async function handleCreateGroup() {
    try {
      const newGroup = {
        groupName: groupName,
        members: selectedMembers.map(email => {
          const selectedEmployee = employees.find(employee => employee.email === email);
          return {
            name: selectedEmployee.name,
            email: selectedEmployee.email,
            task: ""
          };
        })
      };

      const docRef = await addDoc(collection(db, "groups"), newGroup);
      console.log("New group added with ID: ", docRef.id);

      setShowModal(false);
    } catch (error) {
      console.error("Error adding group: ", error);
      setError("Failed to create group");
    }
  }

  async function handleAssignTask(groupId, memberEmail, task) {
    try {
      const updatedMembers = groupsData.find(group => group.id === groupId).members.map(member => {
        if (member.email === memberEmail) {
          return { ...member, task: task };
        } else {
          return member;
        }
      });
      setGroupsData(prevGroupsData => prevGroupsData.map(group => group.id === groupId ? { ...group, members: updatedMembers } : group));
  
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        members: updatedMembers
      }).then(() => {
        console.log("Task assigned successfully.");
      }).catch((error) => {
        console.error("Error updating group document:", error);
        setError("Failed to assign task");
      });
    } catch (error) {
      console.error("Error assigning task:", error);
      setError("Failed to assign task");
    }
  }

  async function handleUpdateTask(groupId, memberEmail, currentTask) {
    try {
      const { value: newTask } = await Swal.fire({
        title: 'Update Task',
        input: 'text',
        inputValue: currentTask,
        inputPlaceholder: 'Enter new task',
        showCancelButton: true,
        confirmButtonText: 'Update',
        cancelButtonText: 'Cancel',
        inputValidator: (value) => {
          if (!value) {
            return 'Task cannot be empty';
          }
        }
      });

      if (newTask) {
        handleAssignTask(groupId, memberEmail, newTask);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
    }
  }

  async function handleDeleteTask(groupId, memberEmail) {
    try {
      const updatedMembers = groupsData.find(group => group.id === groupId).members.map(member => {
        if (member.email === memberEmail) {
          return { ...member, task: '' }; // Set task to empty string
        } else {
          return member;
        }
      });
      setGroupsData(prevGroupsData => prevGroupsData.map(group => group.id === groupId ? { ...group, members: updatedMembers } : group));

      // Firestore update
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        members: updatedMembers
      }).then(() => {
        console.log("Task deleted successfully.");
        Swal.fire('Deleted!', 'Task has been deleted.', 'success');
      }).catch((error) => {
        console.error('Error deleting task:', error);
        setError('Failed to delete task');
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
    }
  }

  async function handleDeleteGroup(groupId) {
    try {
      const groupRef = doc(db, "groups", groupId);
      await deleteDoc(groupRef);
      setGroupsData(prevGroupsData => prevGroupsData.filter(group => group.id !== groupId));
      Swal.fire('Deleted!', 'Group has been deleted.', 'success');
    } catch (error) {
      console.error('Error deleting group:', error);
      setError('Failed to delete group');
    }
  }

  useEffect(() => {
    async function fetchEmployeesData() {
      try {
        const querySnapshot = await getDocs(collection(db, "employees"));
        const data = querySnapshot.docs.map((doc) => doc.data());
        setEmployees(data);
      } catch (error) {
        console.error("Error fetching employees data:", error);
        setError("Failed to fetch employees data");
      }
    }

    async function fetchGroupsData() {
      try {
        const unsubscribe = onSnapshot(collection(db, "groups"), (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            groupName: doc.data().groupName,
            members: doc.data().members
          }));
          setGroupsData(data);
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error fetching groups data:", error);
        setError("Failed to fetch groups data");
      }
    }

    fetchEmployeesData().then(fetchGroupsData);

    return () => {
      fetchGroupsData().then(unsubscribe => unsubscribe());
    };
  }, []);

  const handleTaskAssignButtonClick = (groupId, memberEmail) => {
    Swal.fire({
      title: "Assign Task",
      input: "text",
      inputLabel: "Enter task for this member",
      inputPlaceholder: "Task",
      showCancelButton: true,
      confirmButtonText: "Assign",
      cancelButtonText: "Cancel",
      inputValidator: (value) => {
        if (!value) {
          return "Task cannot be empty";
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        handleAssignTask(groupId, memberEmail, result.value);
      }
    });
  };

  const handleGroupClick = (groupId) => {
    const group = groupsData.find(group => group.id === groupId);
    setSelectedGroup(group);
  };

  return (
    <>
      <Navbar bg="light" expand="lg">
        <Navbar.Brand href="#home">Dashboard</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Nav.Link as={Link} to="/update-profile">Update Profile</Nav.Link>
          </Nav>
          <Navbar.Text>
            Signed in as: <strong>{currentUser?.email}</strong>
          </Navbar.Text>
          <Button variant="link" onClick={handleLogout}>Log Out</Button>
        </Navbar.Collapse>
      </Navbar>
      <div className="container mt-4">
        <Row>
          <Col sm={6}>
            <h2 className="text-center mb-4">Employees Data</h2>
            <ListGroup>
              {employees.map((employee, index) => (
                <ListGroup.Item key={index}>
                  <p><strong>Name:</strong> {employee.name}</p>
                  <p><strong>Email:</strong> {employee.email}</p>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>
          <Col sm={6}>
            <h2 className="text-center mb-4">Groups Data</h2>
            {groupsData.map((group, index) => (
              <div key={index} className="mb-4">
                <h3 onClick={() => handleGroupClick(group.id)} style={{ cursor: "pointer" }}>{group.groupName}</h3>
                {selectedGroup && selectedGroup.id === group.id && (
                  <ListGroup>
                    {selectedGroup.members.map((member, memberIndex) => (
                      <ListGroup.Item key={memberIndex}>
                        <p><strong>Name:</strong> {member.name}</p>
                        <p><strong>Email:</strong> {member.email}</p>
                        <p><strong>Task:</strong> {member.task}</p>
                        <Button variant="primary" onClick={() => handleTaskAssignButtonClick(group.id, member.email)}>
                          Assign Task
                        </Button>
                        <Button variant="info" onClick={() => handleUpdateTask(group.id, member.email, member.task)}>
                          Update Task
                        </Button>
                        <Button variant="danger" onClick={() => handleDeleteTask(group.id, member.email)}>
                          Delete Task
                        </Button>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
                <Button variant="danger" onClick={() => handleDeleteGroup(group.id)}>
                  Delete Group
                </Button>
              </div>
            ))}
          </Col>
        </Row>
        <Button className="float-right mt-2" onClick={() => setShowModal(true)}>Create New Group</Button>
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Create New Group</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group controlId="groupName">
                <Form.Label>Group Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </Form.Group>
              <Form.Group controlId="selectedMembers">
                <Form.Label>Select Members</Form.Label>
                <Form.Control
                  as="select"
                  multiple
                  value={selectedMembers}
                  onChange={(e) =>
                    setSelectedMembers(Array.from(e.target.selectedOptions, (item) => item.value))
                  }
                >
                  {employees.map((employee, index) => (
                    <option key={index} value={employee.email}>
                      {employee.name}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={handleCreateGroup}>
              Create Group
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
}
