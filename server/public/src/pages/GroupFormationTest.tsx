import { useState, useEffect } from "react";
import { useToast } from "../hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Separator } from "../components/ui/separator";
import { 
  Users, UserCheck, BarChart3, Loader2, RefreshCw, 
  Info, CheckCircle, Table, Tables, ArrowRight, 
  ArrowDown, AlertCircle
} from "lucide-react";
import { apiRequest } from "../lib/queryClient";

type User = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role?: string;
  profilePicture?: string | null;
  isPremiumUser?: boolean;
};

type DiningGroup = {
  users: User[];
  averageCompatibility: number;
};

const GroupFormationTest = () => {
  const { toast } = useToast();
  const [userCount, setUserCount] = useState<number>(18);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [groups, setGroups] = useState<DiningGroup[]>([]);
  const [isTestingGroups, setIsTestingGroups] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [randomSelectionCount, setRandomSelectionCount] = useState<number>(15);
  const [activeTab, setActiveTab] = useState("manual-selection");

  // Fetch all users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const response = await apiRequest("GET", "/api/admin/users/analytics");
        const data = await response.json();
        setAllUsers(data);
      } catch (error) {
        toast({
          title: "Error fetching users",
          description: "Could not load user data for testing.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [toast]);

  const filteredUsers = allUsers.filter(user => 
    user.fullName?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    user.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const handleUserSelection = (user: User, isSelected: boolean) => {
    if (isSelected) {
      setSelectedUsers(prev => [...prev, user]);
    } else {
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    }
  };

  const handleRandomSelection = () => {
    if (allUsers.length === 0) {
      toast({
        title: "No users available",
        description: "Please wait for users to load or try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Shuffle all users and take the first n
    const shuffled = [...allUsers].sort(() => 0.5 - Math.random());
    const randomUsers = shuffled.slice(0, randomSelectionCount);
    setSelectedUsers(randomUsers);
    
    toast({
      title: "Random selection complete",
      description: `Selected ${randomUsers.length} users randomly.`,
    });
    
    // Switch to manual selection tab to show results
    setActiveTab("manual-selection");
  };

  const testGroupFormation = async () => {
    if (selectedUsers.length < 4) {
      toast({
        title: "Not enough users",
        description: "Please select at least 4 users to test group formation.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingGroups(true);
    
    try {
      const response = await apiRequest("POST", "/api/test-group-formation", {
        userIds: selectedUsers.map(user => user.id)
      });
      
      const data = await response.json();
      setGroups(data);
      
      toast({
        title: "Group formation complete",
        description: `Created ${data.length} groups from ${selectedUsers.length} users.`,
      });
    } catch (error) {
      toast({
        title: "Error forming groups",
        description: "Could not test group formation algorithm.",
        variant: "destructive",
      });
    } finally {
      setIsTestingGroups(false);
    }
  };
  
  const getColorForGroupSize = (size: number) => {
    // Ideal is 5-6 users (index 0-based, so 4-5)
    if (size === 4 || size === 5) return "border-green-400 bg-green-50";
    // Minimum is 4 users (index 3)
    else if (size === 3) return "border-yellow-400 bg-yellow-50";
    // Maximum is 7 users (index 6)
    else if (size === 6) return "border-blue-400 bg-blue-50";
    // Anything else is out of spec
    else return "border-red-400 bg-red-50";
  };

  const getGroupSizeLabel = (size: number) => {
    // Ideal is 5-6 users (index 0-based, so 4-5)
    if (size === 4 || size === 5) return "Ideal";
    // Minimum is 4 users (index 3)
    else if (size === 3) return "Minimum";
    // Maximum is 7 users (index 6)
    else if (size === 6) return "Maximum";
    // Anything else is out of spec
    else return "Out of spec";
  };

  const getBadgeColor = (size: number) => {
    // Ideal is 5-6 users (index 0-based, so 4-5)
    if (size === 4 || size === 5) return "bg-green-500";
    // Minimum is 4 users (index 3)
    else if (size === 3) return "bg-yellow-500";
    // Maximum is 7 users (index 6)
    else if (size === 6) return "bg-blue-500";
    // Anything else is out of spec
    else return "bg-red-500";
  };

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Group Formation Testing</h1>
            <p className="text-gray-500 mt-2">
              Test the optimal group formation algorithm with selected users
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/super-admin-dashboard"}
          >
            Back to Dashboard
          </Button>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-5 w-5 text-blue-500" />
          <AlertTitle className="text-blue-800">About the Group Formation Algorithm</AlertTitle>
          <AlertDescription className="text-blue-700">
            <p className="mb-2">
              The algorithm creates optimal dining groups with the following constraints:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Target:</strong> 5-6 users per table (plus 1 host)</li>
              <li><strong>Minimum:</strong> 4 users per table (plus 1 host)</li>
              <li><strong>Maximum:</strong> 7 users per table (plus 1 host)</li>
              <li><strong>Balance:</strong> Distribute users evenly (max difference: 1 person)</li>
              <li><strong>Priorities:</strong> Group size balance first, compatibility second</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="manual-selection" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual-selection">Manual User Selection</TabsTrigger>
            <TabsTrigger value="random-selection">Random Selection</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual-selection" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Selected Users ({selectedUsers.length})</CardTitle>
                    <CardDescription>
                      Select users to include in the group formation test
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedUsers([])}
                      disabled={selectedUsers.length === 0}
                    >
                      Clear All
                    </Button>
                    <Button 
                      onClick={testGroupFormation}
                      disabled={selectedUsers.length < 4 || isTestingGroups}
                    >
                      {isTestingGroups ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Users className="mr-2 h-4 w-4" />
                          Form Groups
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input
                      placeholder="Search users..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                    />
                  </div>

                  {isLoadingUsers ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] rounded-md border p-2">
                      <div className="space-y-2">
                        {filteredUsers.map((user) => (
                          <div 
                            key={user.id} 
                            className={`flex items-center justify-between p-2 rounded-lg ${
                              selectedUsers.some(u => u.id === user.id) 
                                ? 'bg-primary/10' 
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox 
                                id={`user-${user.id}`}
                                checked={selectedUsers.some(u => u.id === user.id)}
                                onCheckedChange={(checked) => 
                                  handleUserSelection(user, checked === true)
                                }
                              />
                              <Avatar className="h-10 w-10">
                                {user.profilePicture ? (
                                  <AvatarFallback>{user.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                ) : (
                                  <AvatarFallback>{user.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                )}
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.fullName}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {user.isPremiumUser && (
                                <Badge className="bg-gradient-to-r from-amber-500 to-amber-300 text-black">
                                  Premium
                                </Badge>
                              )}
                              {user.role && (
                                <Badge variant={
                                  user.role === "super_admin" 
                                    ? "destructive" 
                                    : user.role === "admin" 
                                    ? "default" 
                                    : "secondary"
                                }>
                                  {user.role}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="random-selection" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Random User Selection</CardTitle>
                <CardDescription>
                  Quickly test with a random set of users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="user-count">Number of users to select randomly</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="user-count"
                        type="number"
                        min={4}
                        max={allUsers.length}
                        value={randomSelectionCount}
                        onChange={(e) => setRandomSelectionCount(parseInt(e.target.value))}
                        className="w-24"
                      />
                      <Button 
                        onClick={handleRandomSelection}
                        disabled={isLoadingUsers || allUsers.length === 0}
                      >
                        {isLoadingUsers ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Select Random Users
                      </Button>
                    </div>
                  </div>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Important</AlertTitle>
                    <AlertDescription>
                      Random selection will replace your current user selection.
                      The selected users will be shown in the Manual Selection tab.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {groups.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Group Formation Results</h2>
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium">
                  {selectedUsers.length} Users ÷ {groups.length} Groups = 
                  <span className="font-bold text-primary ml-1">
                    {(selectedUsers.length / groups.length).toFixed(1)} Users/Group
                  </span>
                </p>
                <Button variant="outline" size="sm" onClick={testGroupFormation}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Rerun Test
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group, index) => (
                <Card 
                  key={index} 
                  className={`border-l-4 ${getColorForGroupSize(group.users.length - 1)}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle>Group {index + 1}</CardTitle>
                      <Badge 
                        className={getBadgeColor(group.users.length - 1)}
                      >
                        {group.users.length} Users ({getGroupSizeLabel(group.users.length - 1)})
                      </Badge>
                    </div>
                    <CardDescription>
                      Host: <span className="font-semibold">{group.users[0].fullName}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-3">
                        {/* Host */}
                        <div className="flex items-center gap-3 bg-primary/5 p-2 rounded-md">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{group.users[0].username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{group.users[0].fullName}</p>
                              <Badge variant="outline" className="ml-auto">Host</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{group.users[0].email}</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        {/* Regular members */}
                        {group.users.slice(1).map((user) => (
                          <div key={user.id} className="flex items-center gap-3 p-2">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{user.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.fullName}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            {user.isPremiumUser && (
                              <Badge className="ml-auto bg-gradient-to-r from-amber-500 to-amber-300 text-black">
                                Premium
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <p className="text-sm text-muted-foreground">Table Size: {group.users.length}</p>
                    <p className="text-sm font-medium">
                      <span className="text-muted-foreground">Avg. Compatibility:</span>{' '}
                      {(group.averageCompatibility * 100).toFixed(1)}%
                    </p>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <Card className="bg-muted/40">
              <CardHeader>
                <CardTitle>Group Size Distribution</CardTitle>
                <CardDescription>
                  Analysis of how the algorithm distributed users across tables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[4, 5, 6, 7, 8].map((size) => {
                    const count = groups.filter(g => g.users.length === size).length;
                    const percentage = (count / groups.length) * 100;
                    
                    return (
                      <Card key={size} className="flex flex-col border">
                        <CardHeader className="py-4 px-6">
                          <CardTitle className="text-lg flex items-center justify-between">
                            {size} Person Tables
                            <Badge variant="outline">{count}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-6 flex-1">
                          <div className="flex flex-col items-center justify-center h-full">
                            <span className="text-4xl font-bold">
                              {percentage.toFixed(1)}%
                            </span>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                              <div 
                                className="bg-primary h-2.5 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="py-2 px-6 border-t">
                          <p className="text-xs text-muted-foreground w-full text-center">
                            {size === 5 || size === 6 ? (
                              <span className="flex items-center justify-center gap-1 text-green-600">
                                <CheckCircle className="h-3 w-3" /> Target Size
                              </span>
                            ) : size === 4 ? (
                              <span className="flex items-center justify-center gap-1 text-amber-600">
                                <CheckCircle className="h-3 w-3" /> Minimum Size
                              </span>
                            ) : size === 7 ? (
                              <span className="flex items-center justify-center gap-1 text-blue-600">
                                <CheckCircle className="h-3 w-3" /> Maximum Size
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-1 text-red-600">
                                <AlertCircle className="h-3 w-3" /> Out of Spec
                              </span>
                            )}
                          </p>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupFormationTest;